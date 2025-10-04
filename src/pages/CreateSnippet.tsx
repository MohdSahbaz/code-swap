import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { Navbar } from "@/components/Navbar";
import { ArrowLeft } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const LANGUAGES = [
  "JavaScript",
  "TypeScript",
  "Python",
  "Java",
  "C++",
  "C#",
  "Go",
  "Rust",
  "Ruby",
  "PHP",
  "Swift",
  "Kotlin",
  "HTML",
  "CSS",
  "SQL",
  "Bash",
];

export default function CreateSnippet() {
  const [user, setUser] = useState<any>(null);
  const [title, setTitle] = useState("");
  const [language, setLanguage] = useState("");
  const [description, setDescription] = useState("");
  const [code, setCode] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!session) {
        navigate("/auth");
      } else {
        setUser(session.user);
      }
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!session) {
        navigate("/auth");
      } else {
        setUser(session.user);
      }
    });

    return () => subscription.unsubscribe();
  }, [navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    setLoading(true);

    try {
      const { error } = await supabase.from("snippets").insert({
        user_id: user.id,
        title,
        language,
        description,
        code,
      });

      if (error) throw error;

      toast({
        title: "Snippet Published 🎉",
        description: "Your code snippet has been shared!",
      });
      navigate("/");
    } catch (error: any) {
      toast({
        title: "Error creating snippet",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Navbar user={user} />
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <Button variant="ghost" onClick={() => navigate("/")} className="mb-6">
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Feed
        </Button>

        <Card className="p-8 bg-card border-border">
          <h1 className="text-3xl font-bold mb-6 bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
            Create New Snippet
          </h1>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="title">Title</Label>
              <Input
                id="title"
                type="text"
                placeholder="E.g., Quick Sort Algorithm"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                required
                className="bg-secondary border-border"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="language">Language</Label>
              <Select value={language} onValueChange={setLanguage} required>
                <SelectTrigger className="bg-secondary border-border">
                  <SelectValue placeholder="Select a language" />
                </SelectTrigger>
                <SelectContent className="bg-popover border-border">
                  {LANGUAGES.map((lang) => (
                    <SelectItem key={lang} value={lang}>
                      {lang}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                placeholder="Brief description of your snippet (max 120 characters)"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                maxLength={120}
                required
                className="bg-secondary border-border resize-none"
                rows={3}
              />
              <p className="text-xs text-muted-foreground">
                {description.length}/120 characters
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="code">Code</Label>
              <Textarea
                id="code"
                placeholder="Paste your code here..."
                value={code}
                onChange={(e) => setCode(e.target.value)}
                required
                className="bg-secondary border-border font-mono text-sm resize-none"
                rows={15}
              />
            </div>

            <Button
              type="submit"
              className="w-full bg-gradient-to-r from-primary to-accent hover:opacity-90"
              disabled={loading}
            >
              {loading ? "Publishing..." : "Publish Snippet"}
            </Button>
          </form>
        </Card>
      </div>
    </div>
  );
}
