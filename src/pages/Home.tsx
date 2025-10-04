import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Navbar } from "@/components/Navbar";
import { SnippetCard } from "@/components/SnippetCard";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Sparkles } from "lucide-react";

export default function Home() {
  const [user, setUser] = useState<any>(null);
  const [snippets, setSnippets] = useState<any[]>([]);
  const [filteredSnippets, setFilteredSnippets] = useState<any[]>([]);
  const [sortBy, setSortBy] = useState("newest");
  const [selectedLanguage, setSelectedLanguage] = useState("all");
  const [languages, setLanguages] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [userLikes, setUserLikes] = useState<Set<string>>(new Set());
  const [commentCounts, setCommentCounts] = useState<Record<string, number>>(
    {}
  );

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
    fetchSnippets();
  }, []);

  useEffect(() => {
    if (user) {
      fetchUserLikes();
    }
  }, [user]);

  useEffect(() => {
    applyFilters();
  }, [snippets, sortBy, selectedLanguage]);

  const fetchSnippets = async () => {
    try {
      const { data, error } = await supabase
        .from("snippets")
        .select(
          `
          *,
          profiles (username)
        `
        )
        .order("created_at", { ascending: false });

      if (error) throw error;

      setSnippets(data || []);

      const uniqueLangs = Array.from(
        new Set(data?.map((s) => s.language) || [])
      ).sort();
      setLanguages(uniqueLangs);

      if (data) {
        const counts: Record<string, number> = {};
        for (const snippet of data) {
          const { count } = await supabase
            .from("comments")
            .select("*", { count: "exact", head: true })
            .eq("snippet_id", snippet.id);
          counts[snippet.id] = count || 0;
        }
        setCommentCounts(counts);
      }
    } catch (error) {
      console.error("Error fetching snippets:", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchUserLikes = async () => {
    if (!user) return;
    try {
      const { data } = await supabase
        .from("snippet_likes")
        .select("snippet_id")
        .eq("user_id", user.id);

      if (data) {
        setUserLikes(new Set(data.map((like) => like.snippet_id)));
      }
    } catch (error) {
      console.error("Error fetching user likes:", error);
    }
  };

  const applyFilters = () => {
    let filtered = [...snippets];

    if (selectedLanguage !== "all") {
      filtered = filtered.filter((s) => s.language === selectedLanguage);
    }

    if (sortBy === "mostLiked") {
      filtered.sort((a, b) => b.likes - a.likes);
    } else {
      filtered.sort(
        (a, b) =>
          new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      );
    }

    setFilteredSnippets(filtered);
  };

  const handleSearch = (query: string) => {
    if (!query.trim()) {
      applyFilters();
      return;
    }

    const searched = snippets.filter(
      (snippet) =>
        snippet.title.toLowerCase().includes(query.toLowerCase()) ||
        snippet.description.toLowerCase().includes(query.toLowerCase()) ||
        snippet.language.toLowerCase().includes(query.toLowerCase())
    );

    setFilteredSnippets(searched);
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
      <Navbar user={user} onSearch={handleSearch} />

      <div className="container mx-auto px-4 py-8">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-12">
            <h1 className="text-5xl font-bold pb-4 bg-gradient-to-r from-primary via-accent to-primary bg-clip-text text-transparent animate-fade-in">
              Discover Amazing Code Snippets
            </h1>
            <p className="text-xl text-muted-foreground">
              Share, learn, and grow with the developer community
            </p>
          </div>

          <div className="flex flex-col md:flex-row gap-6">
            <aside className="md:w-64 space-y-4">
              <Card className="p-4 bg-card border-border">
                <h3 className="font-semibold mb-3 flex items-center gap-2">
                  <Sparkles className="h-4 w-4 text-primary" />
                  Filters
                </h3>
                <div className="space-y-3">
                  <div>
                    <label className="text-sm text-muted-foreground mb-2 block">
                      Sort By
                    </label>
                    <Select value={sortBy} onValueChange={setSortBy}>
                      <SelectTrigger className="bg-secondary border-border">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="bg-popover border-border">
                        <SelectItem value="newest">Newest</SelectItem>
                        <SelectItem value="mostLiked">Most Liked</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <label className="text-sm text-muted-foreground mb-2 block">
                      Language
                    </label>
                    <Select
                      value={selectedLanguage}
                      onValueChange={setSelectedLanguage}
                    >
                      <SelectTrigger className="bg-secondary border-border">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="bg-popover border-border max-h-60">
                        <SelectItem value="all">All Languages</SelectItem>
                        {languages.map((lang) => (
                          <SelectItem key={lang} value={lang}>
                            {lang}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </Card>

              <Card className="p-4 bg-card border-border">
                <h3 className="font-semibold mb-3">Trending Tags</h3>
                <div className="flex flex-wrap gap-2">
                  {languages.slice(0, 8).map((lang) => (
                    <Button
                      key={lang}
                      variant="outline"
                      size="sm"
                      onClick={() => setSelectedLanguage(lang)}
                      className="text-xs"
                    >
                      {lang}
                    </Button>
                  ))}
                </div>
              </Card>
            </aside>

            <main className="flex-1">
              {filteredSnippets.length === 0 ? (
                <Card className="p-12 bg-card border-border text-center">
                  <p className="text-muted-foreground">
                    No snippets found. Be the first to share!
                  </p>
                </Card>
              ) : (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {filteredSnippets.map((snippet) => (
                    <SnippetCard
                      key={snippet.id}
                      snippet={snippet}
                      currentUserId={user?.id}
                      isLiked={userLikes.has(snippet.id)}
                      commentCount={commentCounts[snippet.id] || 0}
                      onLikeChange={() => {
                        fetchUserLikes();
                        fetchSnippets();
                      }}
                    />
                  ))}
                </div>
              )}
            </main>
          </div>
        </div>
      </div>
    </div>
  );
}
