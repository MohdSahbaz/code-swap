import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { Navbar } from "@/components/Navbar";
import { CodeBlock } from "@/components/CodeBlock";
import {
  Heart,
  MessageCircle,
  ArrowLeft,
  Calendar,
  Trash2,
} from "lucide-react";
import { formatDistanceToNow } from "date-fns";

export default function SnippetDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [user, setUser] = useState<any>(null);
  const [snippet, setSnippet] = useState<any>(null);
  const [comments, setComments] = useState<any[]>([]);
  const [newComment, setNewComment] = useState("");
  const [isLiked, setIsLiked] = useState(false);
  const [likeCount, setLikeCount] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user || null);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user || null);
    });

    return () => subscription.unsubscribe();
  }, []);

  useEffect(() => {
    if (id) {
      fetchSnippet();
      fetchComments();
      if (user) {
        checkIfLiked();
      }
    }
  }, [id, user]);

  const fetchSnippet = async () => {
    try {
      const { data, error } = await supabase
        .from("snippets")
        .select(
          `
          *,
          profiles (username)
        `
        )
        .eq("id", id)
        .single();

      if (error) throw error;
      setSnippet(data);
      setLikeCount(data.likes);
    } catch (error: any) {
      toast({
        title: "Error loading snippet",
        description: error.message,
        variant: "destructive",
      });
      navigate("/");
    } finally {
      setLoading(false);
    }
  };

  const fetchComments = async () => {
    try {
      const { data, error } = await supabase
        .from("comments")
        .select(
          `
          *,
          profiles (username)
        `
        )
        .eq("snippet_id", id)
        .order("created_at", { ascending: false });

      if (error) throw error;
      setComments(data || []);
    } catch (error: any) {
      console.error("Error fetching comments:", error);
    }
  };

  const checkIfLiked = async () => {
    if (!user) return;
    try {
      const { data } = await supabase
        .from("snippet_likes")
        .select("id")
        .eq("snippet_id", id)
        .eq("user_id", user.id)
        .maybeSingle();

      setIsLiked(!!data);
    } catch (error) {
      console.error("Error checking like status:", error);
    }
  };

  const handleLike = async () => {
    if (!user) {
      toast({
        title: "Please sign in to like snippets",
        variant: "destructive",
      });
      return;
    }

    try {
      if (isLiked) {
        await supabase
          .from("snippet_likes")
          .delete()
          .eq("snippet_id", id)
          .eq("user_id", user.id);
        setIsLiked(false);
        setLikeCount((prev) => prev - 1);
      } else {
        await supabase.from("snippet_likes").insert({
          snippet_id: id,
          user_id: user.id,
        });
        setIsLiked(true);
        setLikeCount((prev) => prev + 1);
      }
    } catch (error: any) {
      toast({
        title: "Error updating like",
        variant: "destructive",
      });
    }
  };

  const handleAddComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) {
      toast({
        title: "Please sign in to comment",
        variant: "destructive",
      });
      return;
    }

    if (!newComment.trim()) return;

    try {
      const { error } = await supabase.from("comments").insert({
        snippet_id: id,
        user_id: user.id,
        text: newComment,
      });

      if (error) throw error;

      setNewComment("");
      fetchComments();
      toast({
        title: "Comment added!",
      });
    } catch (error: any) {
      toast({
        title: "Error adding comment",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const handleDeleteComment = async (commentId: string) => {
    try {
      const { error } = await supabase
        .from("comments")
        .delete()
        .eq("id", commentId);

      if (error) throw error;

      fetchComments();
      toast({
        title: "Comment deleted",
      });
    } catch (error: any) {
      toast({
        title: "Error deleting comment",
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

  if (!snippet) return null;

  return (
    <div className="min-h-screen bg-background">
      <Navbar user={user} />
      <div className="container mx-auto px-4 py-8 max-w-5xl">
        <Button variant="ghost" onClick={() => navigate("/")} className="mb-6">
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Feed
        </Button>

        <Card className="p-8 bg-card border-border mb-6">
          <div className="flex items-start justify-between mb-4">
            <div className="flex-1">
              <h1 className="text-3xl font-bold mb-3">{snippet.title}</h1>
              <div className="flex items-center gap-4 text-sm text-muted-foreground">
                <span className="px-3 py-1 rounded-md bg-primary/10 text-primary border border-primary/20">
                  {snippet.language}
                </span>
                <span>by @{snippet.profiles.username}</span>
                <span className="flex items-center gap-1">
                  <Calendar className="h-3 w-3" />
                  {formatDistanceToNow(new Date(snippet.created_at), {
                    addSuffix: true,
                  })}
                </span>
              </div>
            </div>
          </div>

          <p className="text-muted-foreground mb-6">{snippet.description}</p>

          <CodeBlock code={snippet.code} language={snippet.language} />

          <div className="flex items-center gap-3 mt-6 pt-6 border-t border-border">
            <Button
              variant={isLiked ? "default" : "ghost"}
              onClick={handleLike}
              className={isLiked ? "bg-red-500 hover:bg-red-600" : ""}
            >
              <Heart
                className={`h-4 w-4 mr-2 ${isLiked ? "fill-current" : ""}`}
              />
              {likeCount} Likes
            </Button>
            <Button variant="ghost">
              <MessageCircle className="h-4 w-4 mr-2" />
              {comments.length} Comments
            </Button>
          </div>
        </Card>

        <Card className="p-6 bg-card border-border">
          <h2 className="text-xl font-semibold mb-4">Comments</h2>

          {user && (
            <form onSubmit={handleAddComment} className="mb-6">
              <Textarea
                placeholder="Add a comment..."
                value={newComment}
                onChange={(e) => setNewComment(e.target.value)}
                className="bg-secondary border-border resize-none mb-3"
                rows={3}
              />
              <Button
                type="submit"
                className="bg-gradient-to-r from-primary to-accent hover:opacity-90"
              >
                Post Comment
              </Button>
            </form>
          )}

          <div className="space-y-4">
            {comments.length === 0 ? (
              <p className="text-center text-muted-foreground py-8">
                No comments yet. Be the first to comment!
              </p>
            ) : (
              comments.map((comment) => (
                <div
                  key={comment.id}
                  className="p-4 rounded-lg bg-secondary border border-border"
                >
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <span className="font-medium">
                        @{comment.profiles.username}
                      </span>
                      <span className="text-xs text-muted-foreground">
                        {formatDistanceToNow(new Date(comment.created_at), {
                          addSuffix: true,
                        })}
                      </span>
                    </div>
                    {user?.id === comment.user_id && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDeleteComment(comment.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                  <p className="text-foreground">{comment.text}</p>
                </div>
              ))
            )}
          </div>
        </Card>
      </div>
    </div>
  );
}
