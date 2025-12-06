import { useState, useRef } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Plus, Mic, Video, FileText, Smile, Meh, Frown, Zap, Heart, Calendar } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/lib/auth-context";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";

export default function PersonalDiary() {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [entryType, setEntryType] = useState<"text" | "audio" | "video">("text");
  const [isRecording, setIsRecording] = useState(false);
  const [mediaRecorder, setMediaRecorder] = useState<MediaRecorder | null>(null);
  const [recordedBlob, setRecordedBlob] = useState<Blob | null>(null);
  const videoRef = useRef<HTMLVideoElement>(null);

  const { data: entriesData } = useQuery({
    queryKey: ["diary-entries", user?.id],
    queryFn: async () => {
      const res = await apiRequest("GET", `/api/diary?user_id=${user?.id}`);
      return res.json();
    }
  });

  const { data: statsData } = useQuery({
    queryKey: ["diary-stats", user?.id],
    queryFn: async () => {
      const res = await apiRequest("GET", `/api/diary/stats/summary?user_id=${user?.id}`);
      return res.json();
    }
  });

  const createEntryMutation = useMutation({
    mutationFn: async (data: any) => {
      const res = await apiRequest("POST", `/api/diary?user_id=${user?.id}`, data);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["diary-entries"] });
      queryClient.invalidateQueries({ queryKey: ["diary-stats"] });
      toast({ title: "Diary entry created successfully" });
      setShowCreateDialog(false);
      setRecordedBlob(null);
    }
  });

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: true,
        video: entryType === "video"
      });

      if (entryType === "video" && videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play();
      }

      const recorder = new MediaRecorder(stream);
      const chunks: Blob[] = [];

      recorder.ondataavailable = (e) => chunks.push(e.data);
      recorder.onstop = () => {
        const blob = new Blob(chunks, { type: entryType === "audio" ? "audio/webm" : "video/mp4" });
        setRecordedBlob(blob);
        stream.getTracks().forEach(track => track.stop());
      };

      recorder.start();
      setMediaRecorder(recorder);
      setIsRecording(true);
    } catch (error) {
      toast({ title: "Failed to start recording", variant: "destructive" });
    }
  };

  const stopRecording = () => {
    if (mediaRecorder) {
      mediaRecorder.stop();
      setIsRecording(false);
    }
  };

  const handleCreateEntry = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);

    let mediaData = null;
    if (recordedBlob && (entryType === "audio" || entryType === "video")) {
      const reader = new FileReader();
      mediaData = await new Promise((resolve) => {
        reader.onloadend = () => resolve(reader.result);
        reader.readAsDataURL(recordedBlob);
      });
    }

    createEntryMutation.mutate({
      title: formData.get("title"),
      content: formData.get("content"),
      entry_type: entryType,
      mood: formData.get("mood"),
      tags: formData.get("tags"),
      media_data: mediaData
    });
  };

  const getMoodIcon = (mood: string) => {
    switch (mood) {
      case "happy": return <Smile className="h-4 w-4 text-green-600" />;
      case "sad": return <Frown className="h-4 w-4 text-blue-600" />;
      case "stressed": return <Zap className="h-4 w-4 text-orange-600" />;
      case "excited": return <Heart className="h-4 w-4 text-pink-600" />;
      default: return <Meh className="h-4 w-4 text-gray-600" />;
    }
  };

  const entries = entriesData?.entries || [];

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Personal Diary</h1>
        <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              New Entry
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Create Diary Entry</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleCreateEntry} className="space-y-4">
              <Tabs value={entryType} onValueChange={(v) => setEntryType(v as any)}>
                <TabsList className="grid w-full grid-cols-3">
                  <TabsTrigger value="text">
                    <FileText className="h-4 w-4 mr-2" />
                    Text
                  </TabsTrigger>
                  <TabsTrigger value="audio">
                    <Mic className="h-4 w-4 mr-2" />
                    Audio
                  </TabsTrigger>
                  <TabsTrigger value="video">
                    <Video className="h-4 w-4 mr-2" />
                    Video
                  </TabsTrigger>
                </TabsList>

                <TabsContent value="text" className="space-y-4">
                  <div>
                    <Label>Title</Label>
                    <Input name="title" placeholder="Entry title..." />
                  </div>
                  <div>
                    <Label>Content</Label>
                    <Textarea name="content" rows={6} placeholder="Write your thoughts..." required />
                  </div>
                </TabsContent>

                <TabsContent value="audio" className="space-y-4">
                  <div>
                    <Label>Title</Label>
                    <Input name="title" placeholder="Entry title..." />
                  </div>
                  <div className="flex flex-col items-center gap-4 p-6 border rounded-lg">
                    {!isRecording && !recordedBlob && (
                      <Button type="button" onClick={startRecording}>
                        <Mic className="h-4 w-4 mr-2" />
                        Start Recording
                      </Button>
                    )}
                    {isRecording && (
                      <Button type="button" onClick={stopRecording} variant="destructive">
                        Stop Recording
                      </Button>
                    )}
                    {recordedBlob && (
                      <div className="text-center">
                        <p className="text-sm text-green-600 mb-2">✓ Audio recorded</p>
                        <Button type="button" onClick={() => setRecordedBlob(null)} variant="outline" size="sm">
                          Re-record
                        </Button>
                      </div>
                    )}
                  </div>
                </TabsContent>

                <TabsContent value="video" className="space-y-4">
                  <div>
                    <Label>Title</Label>
                    <Input name="title" placeholder="Entry title..." />
                  </div>
                  <div className="flex flex-col items-center gap-4 p-6 border rounded-lg">
                    {isRecording && (
                      <video ref={videoRef} className="w-full max-w-md rounded-lg" muted />
                    )}
                    {!isRecording && !recordedBlob && (
                      <Button type="button" onClick={startRecording}>
                        <Video className="h-4 w-4 mr-2" />
                        Start Recording
                      </Button>
                    )}
                    {isRecording && (
                      <Button type="button" onClick={stopRecording} variant="destructive">
                        Stop Recording
                      </Button>
                    )}
                    {recordedBlob && (
                      <div className="text-center">
                        <p className="text-sm text-green-600 mb-2">✓ Video recorded</p>
                        <Button type="button" onClick={() => setRecordedBlob(null)} variant="outline" size="sm">
                          Re-record
                        </Button>
                      </div>
                    )}
                  </div>
                </TabsContent>
              </Tabs>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Mood</Label>
                  <Select name="mood">
                    <SelectTrigger>
                      <SelectValue placeholder="How are you feeling?" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="happy">😊 Happy</SelectItem>
                      <SelectItem value="sad">😢 Sad</SelectItem>
                      <SelectItem value="neutral">😐 Neutral</SelectItem>
                      <SelectItem value="stressed">😰 Stressed</SelectItem>
                      <SelectItem value="excited">🤩 Excited</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Tags</Label>
                  <Input name="tags" placeholder="work, personal, health..." />
                </div>
              </div>

              <div className="flex justify-end gap-2">
                <Button type="button" variant="outline" onClick={() => setShowCreateDialog(false)}>
                  Cancel
                </Button>
                <Button type="submit" disabled={createEntryMutation.isPending}>
                  {createEntryMutation.isPending ? "Saving..." : "Save Entry"}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm">Total Entries</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{statsData?.total_entries || 0}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm">Text</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{statsData?.text_entries || 0}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm">Audio</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{statsData?.audio_entries || 0}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm">Video</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{statsData?.video_entries || 0}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm">This Week</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{statsData?.entries_this_week || 0}</div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>My Entries</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {entries.map((entry: any) => (
              <Card key={entry.id} className="hover:shadow-md transition-shadow">
                <CardContent className="p-4">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        {entry.entryType === "text" && <FileText className="h-4 w-4" />}
                        {entry.entryType === "audio" && <Mic className="h-4 w-4" />}
                        {entry.entryType === "video" && <Video className="h-4 w-4" />}
                        {entry.title && <h3 className="font-semibold">{entry.title}</h3>}
                        {entry.mood && getMoodIcon(entry.mood)}
                        <Badge variant="outline" className="capitalize">{entry.entryType}</Badge>
                      </div>
                      {entry.content && (
                        <p className="text-sm text-muted-foreground line-clamp-2 mb-2">{entry.content}</p>
                      )}
                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        <Calendar className="h-3 w-3" />
                        {new Date(entry.createdAt).toLocaleDateString()} at {new Date(entry.createdAt).toLocaleTimeString()}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
            {entries.length === 0 && (
              <div className="text-center py-12 text-muted-foreground">
                No diary entries yet. Start recording your thoughts!
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
