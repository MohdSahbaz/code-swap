import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Heart, MessageCircle, Copy, Calendar } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useState } from "react";
import { formatDistanceToNow } from "date-fns";

interface SnippetCardProps {
  snippet: {
    id: string;
    title: string;
    language: string;
    description: string;
    code: string;
    likes: number;
    created_at: string;
    profiles: {
      username: string;
    };
  };
  currentUserId?: string;
  isLiked?: boolean;
  commentCount?: number;
  onLikeChange?: () => void;
}

export const SnippetCard = ({
  snippet,
  currentUserId,
  isLiked = false,
  commentCount = 0,
  onLikeChange,
}: SnippetCardProps) => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [liked, setLiked] = useState(isLiked);
  const [likeCount, setLikeCount] = useState(snippet.likes);

  const handleLike = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!currentUserId) {
      toast({
        title: "Please sign in to like snippets",
        variant: "destructive",
      });
      return;
    }

    try {
      if (liked) {
        await supabase
          .from("snippet_likes")
          .delete()
          .eq("snippet_id", snippet.id)
          .eq("user_id", currentUserId);
        setLiked(false);
        setLikeCount((prev) => prev - 1);
      } else {
        await supabase.from("snippet_likes").insert({
          snippet_id: snippet.id,
          user_id: currentUserId,
        });
        setLiked(true);
        setLikeCount((prev) => prev + 1);
      }
      onLikeChange?.();
    } catch (error) {
      toast({
        title: "Error updating like",
        variant: "destructive",
      });
    }
  };

  const handleCopy = async (e: React.MouseEvent) => {
    e.stopPropagation();
    await navigator.clipboard.writeText(snippet.code);
    toast({
      title: "Code copied to clipboard!",
    });
  };

  return (
    <Card
      className="p-6 bg-card border-border hover:border-primary/50 transition-all duration-300 cursor-pointer group hover:shadow-glow"
      onClick={() => navigate(`/snippet/${snippet.id}`)}
    >
      <div className="flex items-start justify-between mb-3">
        <div className="flex-1">
          <h3 className="text-xl font-semibold mb-2 group-hover:text-primary transition-colors">
            {snippet.title}
          </h3>
          <div className="flex items-center gap-3 text-sm text-muted-foreground">
            <span className="px-2 py-1 rounded-md bg-primary/10 text-primary border border-primary/20">
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

      <p className="text-muted-foreground mb-4 line-clamp-2">
        {snippet.description}
      </p>

      <div className="flex items-center gap-2">
        <Button
          variant="ghost"
          size="sm"
          onClick={handleLike}
          className={liked ? "text-red-500" : ""}
        >
          <Heart className={`h-4 w-4 mr-1 ${liked ? "fill-current" : ""}`} />
          {likeCount}
        </Button>
        <Button variant="ghost" size="sm">
          <MessageCircle className="h-4 w-4 mr-1" />
          {commentCount}
        </Button>
        <Button
          variant="ghost"
          size="sm"
          onClick={handleCopy}
          className="ml-auto"
        >
          <Copy className="h-4 w-4 mr-1" />
          Copy
        </Button>
      </div>
    </Card>
  );
};
