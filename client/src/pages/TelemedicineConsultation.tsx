import { useState, useEffect, useRef } from "react";
import { useParams, useLocation } from "wouter";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Video, VideoOff, Mic, MicOff, PhoneOff, FileText } from "lucide-react";
import AgoraRTC, { IAgoraRTCClient, ICameraVideoTrack, IMicrophoneAudioTrack } from "agora-rtc-sdk-ng";
import { useToast } from "@/hooks/use-toast";

interface TelemedicineSession {
    id: string;
    patient_id: string;
    doctor_id: string;
    scheduled_time: string;
    status: string;
    reason: string;
    notes: string | null;
}

interface VideoToken {
    session_id: string;
    token: string;
    channel_name: string;
    uid: number;
    app_id: string;
    patient_name: string;
    doctor_name: string;
}

export default function TelemedicineConsultation() {
    const { sessionId } = useParams();
    const navigate = useNavigate();
    const { toast } = useToast();

    const [session, setSession] = useState<TelemedicineSession | null>(null);
    const [videoToken, setVideoToken] = useState<VideoToken | null>(null);
    const [notes, setNotes] = useState("");
    const [isVideoEnabled, setIsVideoEnabled] = useState(true);
    const [isAudioEnabled, setIsAudioEnabled] = useState(true);
    const [isCallActive, setIsCallActive] = useState(false);

    const clientRef = useRef<IAgoraRTCClient | null>(null);
    const localVideoTrackRef = useRef<ICameraVideoTrack | null>(null);
    const localAudioTrackRef = useRef<IMicrophoneAudioTrack | null>(null);
    const localVideoRef = useRef<HTMLDivElement>(null);
    const remoteVideoRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (sessionId) {
            fetchSession();
        }
        return () => {
            leaveCall();
        };
    }, [sessionId]);

    const fetchSession = async () => {
        try {
            const response = await fetch(`/api/telemedicine/sessions/${sessionId}`);
            const data = await response.json();
            setSession(data);
            setNotes(data.notes || "");
        } catch (error) {
            console.error("Failed to fetch session:", error);
            toast({
                title: "Error",
                description: "Failed to load consultation session",
                variant: "destructive"
            });
        }
    };

    const startCall = async () => {
        try {
            // Get video token from backend
            const response = await fetch(`/api/telemedicine/sessions/${sessionId}/start?user_id=current_user_id`, {
                method: "POST"
            });
            const tokenData: VideoToken = await response.json();
            setVideoToken(tokenData);

            // Initialize Agora client
            const client = AgoraRTC.createClient({ mode: "rtc", codec: "vp8" });
            clientRef.current = client;

            // Join channel
            await client.join(
                tokenData.app_id,
                tokenData.channel_name,
                tokenData.token,
                tokenData.uid
            );

            // Create local tracks
            const [audioTrack, videoTrack] = await AgoraRTC.createMicrophoneAndCameraTracks();
            localAudioTrackRef.current = audioTrack;
            localVideoTrackRef.current = videoTrack;

            // Play local video
            if (localVideoRef.current) {
                videoTrack.play(localVideoRef.current);
            }

            // Publish tracks
            await client.publish([audioTrack, videoTrack]);

            // Handle remote users
            client.on("user-published", async (user, mediaType) => {
                await client.subscribe(user, mediaType);

                if (mediaType === "video" && remoteVideoRef.current) {
                    user.videoTrack?.play(remoteVideoRef.current);
                }
                if (mediaType === "audio") {
                    user.audioTrack?.play();
                }
            });

            client.on("user-unpublished", (user) => {
                if (remoteVideoRef.current) {
                    remoteVideoRef.current.innerHTML = "";
                }
            });

            setIsCallActive(true);
            toast({
                title: "Call Started",
                description: "Video consultation is now active"
            });
        } catch (error) {
            console.error("Failed to start call:", error);
            toast({
                title: "Error",
                description: "Failed to start video call. Check Agora credentials in .env",
                variant: "destructive"
            });
        }
    };

    const toggleVideo = async () => {
        if (localVideoTrackRef.current) {
            await localVideoTrackRef.current.setEnabled(!isVideoEnabled);
            setIsVideoEnabled(!isVideoEnabled);
        }
    };

    const toggleAudio = async () => {
        if (localAudioTrackRef.current) {
            await localAudioTrackRef.current.setEnabled(!isAudioEnabled);
            setIsAudioEnabled(!isAudioEnabled);
        }
    };

    const leaveCall = async () => {
        try {
            // Stop local tracks
            localVideoTrackRef.current?.stop();
            localVideoTrackRef.current?.close();
            localAudioTrackRef.current?.stop();
            localAudioTrackRef.current?.close();

            // Leave channel
            await clientRef.current?.leave();

            // End session on backend
            if (sessionId) {
                await fetch(`/api/telemedicine/sessions/${sessionId}/end`, {
                    method: "POST"
                });
            }

            setIsCallActive(false);
            toast({
                title: "Call Ended",
                description: "Video consultation has ended"
            });
        } catch (error) {
            console.error("Failed to leave call:", error);
        }
    };

    const saveNotes = async () => {
        try {
            await fetch(`/api/telemedicine/sessions/${sessionId}`, {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ notes })
            });
            toast({
                title: "Notes Saved",
                description: "Consultation notes have been saved"
            });
        } catch (error) {
            console.error("Failed to save notes:", error);
            toast({
                title: "Error",
                description: "Failed to save notes",
                variant: "destructive"
            });
        }
    };

    if (!session) {
        return (
            <div className="flex items-center justify-center h-screen">
                <div className="text-center">
                    <h2 className="text-2xl font-bold">Loading consultation...</h2>
                </div>
            </div>
        );
    }

    return (
        <div className="h-screen flex flex-col bg-gray-900">
            {/* Header */}
            <div className="bg-gray-800 p-4 flex justify-between items-center">
                <div>
                    <h1 className="text-white text-xl font-bold">Telemedicine Consultation</h1>
                    {videoToken && (
                        <p className="text-gray-400 text-sm">
                            {videoToken.patient_name} with {videoToken.doctor_name}
                        </p>
                    )}
                </div>
                <Badge variant={session.status === "in_progress" ? "default" : "secondary"}>
                    {session.status.replace("_", " ").toUpperCase()}
                </Badge>
            </div>

            {/* Video Area */}
            <div className="flex-1 flex gap-4 p-4">
                {/* Main Video (Remote) */}
                <div className="flex-1 bg-black rounded-lg relative overflow-hidden">
                    <div ref={remoteVideoRef} className="w-full h-full"></div>
                    {!isCallActive && (
                        <div className="absolute inset-0 flex items-center justify-center">
                            <div className="text-center text-white">
                                <Video className="h-16 w-16 mx-auto mb-4 opacity-50" />
                                <p className="text-lg">Waiting for remote participant...</p>
                                <Button onClick={startCall} className="mt-4">
                                    Start Call
                                </Button>
                            </div>
                        </div>
                    )}
                </div>

                {/* Sidebar */}
                <div className="w-96 space-y-4">
                    {/* Local Video (Self) */}
                    <Card className="bg-gray-800 border-gray-700">
                        <CardContent className="p-0">
                            <div className="relative h-48 bg-black rounded-t-lg overflow-hidden">
                                <div ref={localVideoRef} className="w-full h-full"></div>
                                {!isCallActive && (
                                    <div className="absolute inset-0 flex items-center justify-center">
                                        <Video className="h-12 w-12 text-white opacity-50" />
                                    </div>
                                )}
                            </div>
                            {/* Controls */}
                            {isCallActive && (
                                <div className="flex justify-center gap-2 p-4 bg-gray-800">
                                    <Button
                                        variant={isVideoEnabled ? "default" : "destructive"}
                                        size="icon"
                                        onClick={toggleVideo}
                                    >
                                        {isVideoEnabled ? <Video className="h-4 w-4" /> : <VideoOff className="h-4 w-4" />}
                                    </Button>
                                    <Button
                                        variant={isAudioEnabled ? "default" : "destructive"}
                                        size="icon"
                                        onClick={toggleAudio}
                                    >
                                        {isAudioEnabled ? <Mic className="h-4 w-4" /> : <MicOff className="h-4 w-4" />}
                                    </Button>
                                    <Button variant="destructive" size="icon" onClick={leaveCall}>
                                        <PhoneOff className="h-4 w-4" />
                                    </Button>
                                </div>
                            )}
                        </CardContent>
                    </Card>

                    {/* Patient Info */}
                    <Card className="bg-gray-800 border-gray-700 text-white">
                        <CardHeader>
                            <CardTitle className="text-white">Consultation Details</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-2 text-sm">
                            <div>
                                <span className="text-gray-400">Reason:</span>
                                <p>{session.reason || "General consultation"}</p>
                            </div>
                            <div>
                                <span className="text-gray-400">Scheduled:</span>
                                <p>{new Date(session.scheduled_time).toLocaleString()}</p>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Doctor Notes */}
                    <Card className="bg-gray-800 border-gray-700">
                        <CardHeader>
                            <CardTitle className="text-white flex items-center gap-2">
                                <FileText className="h-5 w-5" />
                                Consultation Notes
                            </CardTitle>
                            <CardDescription className="text-gray-400">
                                Document your findings and recommendations
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            <Textarea
                                value={notes}
                                onChange={(e) => setNotes(e.target.value)}
                                placeholder="Enter consultation notes..."
                                className="min-h-[200px] bg-gray-900 text-white border-gray-700"
                            />
                            <Button onClick={saveNotes} className="mt-2 w-full">
                                Save Notes
                            </Button>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>
    );
}
