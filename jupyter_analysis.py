"""
Classroom Activity Analysis - Jupyter Notebook Script
This script analyzes student behavior data from the CSV file.

Usage:
1. Place classroom4_ACTIVITY_LOG.csv in the same directory
2. Run in Jupyter Notebook or Python environment
3. Install required packages: pandas, matplotlib, seaborn, numpy
"""

import pandas as pd
import matplotlib.pyplot as plt
import seaborn as sns
import numpy as np
from datetime import datetime

# Set style
sns.set_style("whitegrid")
plt.rcParams['figure.figsize'] = (14, 8)

# Load the data
print("Loading activity log...")
df = pd.read_csv('classroom4_ACTIVITY_LOG.csv')

# Convert timestamp to datetime
df['Timestamp'] = pd.to_datetime(df['Timestamp'])

print(f"\nDataset Overview:")
print(f"Total records: {len(df)}")
print(f"Time range: {df['Timestamp'].min()} to {df['Timestamp'].max()}")
print(f"Unique students: {df['Student_ID'].nunique()}")
print(f"Activity types: {df['Activity'].unique()}")

# ============= 1. Student Engagement Analysis =============
print("\n" + "="*60)
print("STUDENT ENGAGEMENT ANALYSIS")
print("="*60)

# Calculate per-student metrics
student_stats = df.groupby('Student_ID').agg({
    'Activity': 'count',
    'Confidence': 'mean'
}).rename(columns={'Activity': 'Total_Frames', 'Confidence': 'Avg_Confidence'})

# Calculate attentive percentage
attentive_counts = df[df['Activity'] == 'Studying/Attentive'].groupby('Student_ID').size()
student_stats['Attentive_Frames'] = attentive_counts
student_stats['Attentive_Frames'] = student_stats['Attentive_Frames'].fillna(0)
student_stats['Engagement_Pct'] = (student_stats['Attentive_Frames'] / student_stats['Total_Frames']) * 100

# Calculate inattentive behaviors
for activity in ['Sleeping', 'Talking in Class']:
    activity_counts = df[df['Activity'] == activity].groupby('Student_ID').size()
    student_stats[f'{activity}_Frames'] = activity_counts.fillna(0)

student_stats = student_stats.sort_values('Engagement_Pct', ascending=False)

print("\nTop 10 Most Engaged Students:")
print(student_stats.head(10))

print("\nBottom 10 Students (Need Intervention):")
print(student_stats.tail(10))

# ============= 2. Visualizations =============

# Plot 1: Student Engagement Distribution
fig, axes = plt.subplots(2, 2, figsize=(16, 12))

# Engagement histogram
axes[0, 0].hist(student_stats['Engagement_Pct'], bins=20, color='skyblue', edgecolor='black')
axes[0, 0].set_xlabel('Engagement Percentage')
axes[0, 0].set_ylabel('Number of Students')
axes[0, 0].set_title('Distribution of Student Engagement Levels')
axes[0, 0].axvline(student_stats['Engagement_Pct'].mean(), color='red', linestyle='--', label=f"Mean: {student_stats['Engagement_Pct'].mean():.1f}%")
axes[0, 0].legend()

# Top 15 students bar chart
top_students = student_stats.head(15)
axes[0, 1].barh(top_students.index.astype(str), top_students['Engagement_Pct'], color='green', alpha=0.7)
axes[0, 1].set_xlabel('Engagement %')
axes[0, 1].set_ylabel('Student ID')
axes[0, 1].set_title('Top 15 Most Engaged Students')
axes[0, 1].invert_yaxis()

# Activity distribution
activity_counts = df['Activity'].value_counts()
axes[1, 0].pie(activity_counts.values, labels=activity_counts.index, autopct='%1.1f%%', startangle=90)
axes[1, 0].set_title('Overall Behavior Distribution')

# Engagement over time
time_series = df.groupby('Timestamp').agg({
    'Student_ID': 'count',
    'Activity': lambda x: (x == 'Studying/Attentive').sum()
}).rename(columns={'Student_ID': 'Total', 'Activity': 'Attentive'})
time_series['Engagement_Pct'] = (time_series['Attentive'] / time_series['Total']) * 100

axes[1, 1].plot(time_series.index, time_series['Engagement_Pct'], color='blue', linewidth=2)
axes[1, 1].set_xlabel('Time')
axes[1, 1].set_ylabel('Engagement %')
axes[1, 1].set_title('Classroom Engagement Over Time')
axes[1, 1].tick_params(axis='x', rotation=45)

plt.tight_layout()
plt.savefig('classroom_analysis_overview.png', dpi=300, bbox_inches='tight')
plt.show()

# ============= 3. Behavioral Pattern Analysis =============
print("\n" + "="*60)
print("BEHAVIORAL PATTERN ANALYSIS")
print("="*60)

# When do students become inattentive?
inattentive_df = df[df['Activity'] != 'Studying/Attentive'].copy()
inattentive_df['Time'] = inattentive_df['Timestamp'].dt.strftime('%H:%M:%S')

print("\nInattentive Behavior Timeline:")
print(inattentive_df.groupby(['Time', 'Activity']).size().unstack(fill_value=0))

# Plot detailed timeline for at-risk students
at_risk_students = student_stats[student_stats['Engagement_Pct'] < 50].index[:5]

fig, ax = plt.subplots(figsize=(16, 8))

colors = {
    'Studying/Attentive': 'green',
    'Talking in Class': 'orange',
    'Sleeping': 'red',
    'Phone': 'blue'
}

for i, student_id in enumerate(at_risk_students):
    student_data = df[df['Student_ID'] == student_id].sort_values('Timestamp')
    y_position = i
    
    for _, row in student_data.iterrows():
        color = colors.get(row['Activity'], 'gray')
        ax.scatter(row['Timestamp'], y_position, c=color, s=50, alpha=0.6)

ax.set_yticks(range(len(at_risk_students)))
ax.set_yticklabels([f"Student {sid}" for sid in at_risk_students])
ax.set_xlabel('Time')
ax.set_title('Activity Timeline - Top 5 At-Risk Students')
ax.legend(handles=[plt.Line2D([0], [0], marker='o', color='w', markerfacecolor=v, markersize=10, label=k) 
                   for k, v in colors.items()])
plt.xticks(rotation=45)
plt.tight_layout()
plt.savefig('at_risk_students_timeline.png', dpi=300, bbox_inches='tight')
plt.show()

# ============= 4. Recommendations =============
print("\n" + "="*60)
print("TEACHER RECOMMENDATIONS")
print("="*60)

avg_engagement = student_stats['Engagement_Pct'].mean()
print(f"\n📊 Overall Class Engagement: {avg_engagement:.1f}%")

if avg_engagement < 60:
    print("⚠️ ALERT: Class engagement is below 60%. Consider:")
    print("   - Breaking lecture into smaller segments")
    print("   - Adding interactive activities")
    print("   - Taking short breaks")

# Identify critical moments
low_engagement_times = time_series[time_series['Engagement_Pct'] < 50]
if not low_engagement_times.empty:
    print(f"\n⏰ Critical Low-Engagement Periods:")
    for timestamp, row in low_engagement_times.iterrows():
        print(f"   {timestamp}: {row['Engagement_Pct']:.1f}% engaged")
    print("   Recommendation: Review lecture content at these timestamps")

# Students needing intervention
intervention_needed = student_stats[student_stats['Engagement_Pct'] < 40]
if not intervention_needed.empty:
    print(f"\n👨‍🎓 Students Requiring Immediate Intervention: {len(intervention_needed)}")
    print("   Student IDs:", intervention_needed.index.tolist())

# Sleeping patterns
sleeping_students = student_stats[student_stats['Sleeping_Frames'] > 10].index.tolist()
if sleeping_students:
    print(f"\n😴 Students Frequently Sleeping: {sleeping_students}")
    print("   Recommendation: Check if room temperature/lighting is appropriate")

print("\n" + "="*60)
print("Analysis complete! Visualizations saved as PNG files.")
print("="*60)
