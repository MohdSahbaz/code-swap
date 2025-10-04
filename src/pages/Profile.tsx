import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { Navbar } from "@/components/Navbar";
import { SnippetCard } from "@/components/SnippetCard";
import { Calendar, Heart, Code2 } from "lucide-react";
import { formatDistanceToNow } from "date-fns";

export default function Profile() {
  const [user, setUser] = useState<any>(null);
  const [profile, setProfile] = useState<any>(null);
  const [snippets, setSnippets] = useState<any[]>([]);
  const [totalLikes, setTotalLikes] = useState(0);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!session) {
        navigate("/auth");
      } else {
        setUser(session.user);
        fetchProfile(session.user.id);
        fetchUserSnippets(session.user.id);
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

  const fetchProfile = async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", userId)
        .single();

      if (error) throw error;
      setProfile(data);
    } catch (error: any) {
      console.error("Error fetching profile:", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchUserSnippets = async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from("snippets")
        .select(
          `
          *,
          profiles (username)
        `
        )
        .eq("user_id", userId)
        .order("created_at", { ascending: false });

      if (error) throw error;
      setSnippets(data || []);

      const total = data?.reduce((sum, snippet) => sum + snippet.likes, 0) || 0;
      setTotalLikes(total);
    } catch (error: any) {
      console.error("Error fetching snippets:", error);
    }
  };

  const handleDeleteSnippet = async (snippetId: string) => {
    try {
      const { error } = await supabase
        .from("snippets")
        .delete()
        .eq("id", snippetId);

      if (error) throw error;

      toast({
        title: "Snippet deleted",
      });
      if (user) {
        fetchUserSnippets(user.id);
      }
    } catch (error: any) {
      toast({
        title: "Error deleting snippet",
        variant: "destructive",
      });
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar user={user} />
        <div className="container mx-auto px-4 py-8">
          <p className="text-center text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Navbar user={user} />
      <div className="container mx-auto px-4 py-8 max-w-6xl">
        <Card className="p-8 bg-card border-border mb-8">
          <div className="flex items-start justify-between">
            <div>
              <h1 className="text-4xl font-bold mb-2">@{profile?.username}</h1>
              <div className="flex items-center gap-4 text-muted-foreground">
                <span className="flex items-center gap-2">
                  <Calendar className="h-4 w-4" />
                  Joined{" "}
                  {profile?.joined_at &&
                    formatDistanceToNow(new Date(profile.joined_at), {
                      addSuffix: true,
                    })}
                </span>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-8">
            <div className="p-4 rounded-lg bg-secondary border border-border">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-primary/10">
                  <Code2 className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{snippets.length}</p>
                  <p className="text-sm text-muted-foreground">Snippets</p>
                </div>
              </div>
            </div>

            <div className="p-4 rounded-lg bg-secondary border border-border">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-red-500/10">
                  <Heart className="h-5 w-5 text-red-500" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{totalLikes}</p>
                  <p className="text-sm text-muted-foreground">Total Likes</p>
                </div>
              </div>
            </div>

            <div className="p-4 rounded-lg bg-secondary border border-border">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-accent/10">
                  <Code2 className="h-5 w-5 text-accent" />
                </div>
                <div>
                  <p className="text-2xl font-bold">
                    {totalLikes > 0
                      ? (totalLikes / snippets.length).toFixed(1)
                      : "0"}
                  </p>
                  <p className="text-sm text-muted-foreground">Avg Likes</p>
                </div>
              </div>
            </div>
          </div>
        </Card>

        <div>
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold">My Snippets</h2>
            <Button
              onClick={() => navigate("/create")}
              className="bg-gradient-to-r from-primary to-accent hover:opacity-90"
            >
              Create New Snippet
            </Button>
          </div>

          {snippets.length === 0 ? (
            <Card className="p-12 bg-card border-border text-center">
              <p className="text-muted-foreground mb-4">
                You haven't created any snippets yet
              </p>
              <Button
                onClick={() => navigate("/create")}
                className="bg-gradient-to-r from-primary to-accent hover:opacity-90"
              >
                Create Your First Snippet
              </Button>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {snippets.map((snippet) => (
                <div key={snippet.id} className="relative">
                  <SnippetCard snippet={snippet} currentUserId={user?.id} />
                  <Button
                    variant="destructive"
                    size="sm"
                    className="absolute top-4 right-4"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDeleteSnippet(snippet.id);
                    }}
                  >
                    Delete
                  </Button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
