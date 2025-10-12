import { useEffect, useRef, useState } from "react";
import { Camera, CameraOff, Loader2 } from "lucide-react";
import { toast } from "sonner";

interface DetectedFace {
  id: string;
  x: number;
  y: number;
  width: number;
  height: number;
  confidence: number;
}

interface CameraFeedProps {
  onFacesDetected?: (faces: DetectedFace[]) => void;
  onStudentCountChange?: (count: number) => void;
}

export default function CameraFeed({ onFacesDetected, onStudentCountChange }: CameraFeedProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isActive, setIsActive] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [detectedFaces, setDetectedFaces] = useState<DetectedFace[]>([]);
  const [stream, setStream] = useState<MediaStream | null>(null);

  // Mock face detection - in production, this would use ML models
  const detectFaces = () => {
    if (!videoRef.current || !canvasRef.current) return;

    const canvas = canvasRef.current;
    const video = videoRef.current;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // Set canvas size to match video
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;

    // Draw video frame
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

    // Mock detection: generate random faces for demo
    const mockFaces: DetectedFace[] = [];
    const numFaces = Math.floor(Math.random() * 3) + 2; // 2-4 faces

    for (let i = 0; i < numFaces; i++) {
      mockFaces.push({
        id: `face-${i}-${Date.now()}`,
        x: Math.random() * (canvas.width - 100),
        y: Math.random() * (canvas.height - 100),
        width: 80 + Math.random() * 40,
        height: 100 + Math.random() * 40,
        confidence: 0.85 + Math.random() * 0.15,
      });
    }

    // Draw bounding boxes
    ctx.strokeStyle = "hsl(var(--success))";
    ctx.lineWidth = 3;
    ctx.font = "14px sans-serif";
    ctx.fillStyle = "hsl(var(--success))";

    mockFaces.forEach((face, idx) => {
      ctx.strokeRect(face.x, face.y, face.width, face.height);
      ctx.fillText(
        `Student ${idx + 1}`,
        face.x,
        face.y - 5
      );
    });

    setDetectedFaces(mockFaces);
    onFacesDetected?.(mockFaces);
    onStudentCountChange?.(mockFaces.length);
  };

  const startCamera = async () => {
    setIsLoading(true);
    try {
      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: {
          width: { ideal: 1280 },
          height: { ideal: 720 },
          facingMode: "user",
        },
      });

      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
        setStream(mediaStream);
        setIsActive(true);
        toast.success("Camera activated");
      }
    } catch (error) {
      console.error("Error accessing camera:", error);
      toast.error("Failed to access camera. Please check permissions.");
    } finally {
      setIsLoading(false);
    }
  };

  const stopCamera = () => {
    if (stream) {
      stream.getTracks().forEach((track) => track.stop());
      setStream(null);
      setIsActive(false);
      setDetectedFaces([]);
      toast.info("Camera deactivated");
    }
  };

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isActive && videoRef.current?.readyState === 4) {
      // Detect faces every 500ms
      interval = setInterval(detectFaces, 500);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isActive]);

  useEffect(() => {
    return () => {
      if (stream) {
        stream.getTracks().forEach((track) => track.stop());
      }
    };
  }, [stream]);

  return (
    <div className="space-y-4">
      <div className="relative bg-muted rounded-xl overflow-hidden aspect-video">
        <video
          ref={videoRef}
          autoPlay
          playsInline
          muted
          className="absolute inset-0 w-full h-full object-cover"
          style={{ display: isActive ? "block" : "none" }}
        />
        <canvas
          ref={canvasRef}
          className="absolute inset-0 w-full h-full object-cover"
          style={{ display: isActive ? "block" : "none" }}
        />
        {!isActive && (
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="text-center">
              <Camera className="w-16 h-16 mx-auto mb-4 text-muted-foreground" />
              <p className="text-muted-foreground">Camera is off</p>
            </div>
          </div>
        )}
      </div>

      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button
            onClick={isActive ? stopCamera : startCamera}
            disabled={isLoading}
            className="flex items-center gap-2 px-4 py-2 rounded-lg bg-primary text-primary-foreground hover:opacity-90 disabled:opacity-50 transition-opacity"
          >
            {isLoading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Loading...</span>
              </>
            ) : isActive ? (
              <>
                <CameraOff className="w-4 h-4" />
                <span>Stop Camera</span>
              </>
            ) : (
              <>
                <Camera className="w-4 h-4" />
                <span>Start Camera</span>
              </>
            )}
          </button>
          {isActive && (
            <div className="flex items-center gap-2 text-sm">
              <div className="w-2 h-2 rounded-full bg-success animate-pulse" />
              <span className="text-muted-foreground">Live</span>
            </div>
          )}
        </div>
        {isActive && (
          <div className="text-sm">
            <span className="text-muted-foreground">Detected: </span>
            <span className="font-bold text-lg text-primary">{detectedFaces.length}</span>
            <span className="text-muted-foreground"> students</span>
          </div>
        )}
      </div>
    </div>
  );
}
