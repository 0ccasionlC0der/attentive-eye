# Attentive Eye - Classroom Analytics Dashboard

A real-time classroom engagement monitoring system that tracks student behavior, attendance, and provides insights for educators to improve classroom management.

## Features

- **Real-time Monitoring**: Track student engagement and behavior in real-time
- **Behavioral Analytics**: Analyze patterns in student attention, sleeping, talking, and phone usage
- **Student Tracking**: Individual student performance and engagement metrics
- **Intervention Insights**: Identify students who need immediate attention
- **Data Visualization**: Comprehensive charts and graphs for classroom analytics
- **Export Capabilities**: Generate reports and export data for further analysis

## Technologies Used

This project is built with:

- **Frontend**: React 18 with TypeScript
- **UI Framework**: shadcn/ui components with Radix UI primitives
- **Styling**: Tailwind CSS with custom animations
- **Build Tool**: Vite for fast development and building
- **Data Visualization**: Recharts for interactive charts
- **Forms**: React Hook Form with Zod validation
- **Routing**: React Router DOM
- **State Management**: TanStack Query for server state
- **Data Analysis**: Python with pandas, matplotlib, seaborn for Jupyter analysis

## Getting Started

### Prerequisites

- Node.js (v18 or higher) - [Install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating)
- Python 3.8+ (for data analysis scripts)
- npm or yarn package manager

### Installation

1. **Clone the repository**
   ```bash
   git clone <YOUR_GIT_URL>
   cd attentive-eye
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Install Python dependencies** (for data analysis)
   ```bash
   pip install -r requirements.txt
   ```

4. **Start the development server**
   ```bash
   npm run dev
   ```

5. **Open your browser**
   Navigate to `http://localhost:8080` to view the application.

## Project Structure

```
attentive-eye/
├── src/
│   ├── components/          # React components
│   │   ├── ui/             # shadcn/ui components
│   │   ├── ClassroomDashboard.tsx
│   │   └── Navigation.tsx
│   ├── App.tsx             # Main application component
│   ├── main.tsx           # Application entry point
│   └── index.css          # Global styles
├── public/                # Static assets
├── jupyter_analysis.py    # Python data analysis script
├── requirements.txt       # Python dependencies
└── package.json          # Node.js dependencies
```

## Usage

### Web Dashboard
- Access the real-time classroom monitoring interface
- View student engagement metrics and behavioral patterns
- Generate reports and export data
- Monitor individual student performance

### Data Analysis
Run the Python analysis script to process classroom activity logs:

```bash
python jupyter_analysis.py
```

This will:
- Load and process classroom activity data
- Generate engagement analytics
- Create visualizations and charts
- Provide teacher recommendations
- Export analysis results as PNG files

## Development

### Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run build:dev` - Build for development
- `npm run lint` - Run ESLint
- `npm run preview` - Preview production build

### Code Quality

The project uses:
- **ESLint** for code linting
- **TypeScript** for type safety
- **Prettier** (via ESLint) for code formatting

## Deployment

### Build for Production

```bash
npm run build
```

The built files will be in the `dist/` directory, ready for deployment to any static hosting service.

### Deployment Options

- **Vercel**: Connect your GitHub repository for automatic deployments
- **Netlify**: Deploy directly from the `dist/` folder
- **GitHub Pages**: Use GitHub Actions for automated deployment
- **AWS S3**: Upload the `dist/` folder to an S3 bucket with static hosting

## Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Support

For support and questions, please open an issue in the GitHub repository.