"use client";

import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
} from "react";

interface MultiLangField {
  en: string;
  "zh-TW": string;
}

interface BlogPost {
  _id: string;
  title: MultiLangField;
  content: MultiLangField;
  excerpt: MultiLangField;
  author: {
    _id: string;
    name: string;
    email: string;
  };
  status: "draft" | "published";
  featured: boolean;
  mainImage?: string;
  tags: string[];
  category: string;
  slug: string;
  publishedAt?: Date;
  updatedAt: Date;
  createdAt: Date;
  seo: {
    metaTitle: MultiLangField;
    metaDescription: MultiLangField;
    keywords: string[];
  };
}

interface BlogContextType {
  featuredPost: BlogPost | null;
  refreshFeaturedPost: () => Promise<void>;
}

const BlogContext = createContext<BlogContextType>({
  featuredPost: null,
  refreshFeaturedPost: async () => {},
});

export const useBlog = () => {
  const context = useContext(BlogContext);
  if (!context) {
    throw new Error("useBlog must be used within a BlogProvider");
  }
  return context;
};

export const BlogProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [featuredPost, setFeaturedPost] = useState<BlogPost | null>(null);

  const fetchFeaturedPost = useCallback(async () => {
    try {
      const res = await fetch("/api/blog/featured", {
        cache: "no-store",
        next: { revalidate: 0 },
      });

      const data = await res.json();

      // If no featured post exists, just set it to null without throwing an error
      if (!data || res.status === 404) {
        setFeaturedPost(null);
        return;
      }

      // Transform the post data to ensure proper structure
      if (data) {
        const post = {
          ...data,
          title:
            typeof data.title === "object"
              ? data.title
              : { en: data.title, "zh-TW": data.title },
          content:
            typeof data.content === "object"
              ? data.content
              : { en: data.content, "zh-TW": data.content },
          excerpt:
            typeof data.excerpt === "object"
              ? data.excerpt
              : { en: data.excerpt, "zh-TW": data.excerpt },
          author:
            typeof data.author === "object"
              ? data.author
              : { _id: "", name: data.author, email: "" },
          seo: {
            ...data.seo,
            metaTitle:
              typeof data.seo?.metaTitle === "object"
                ? data.seo.metaTitle
                : {
                    en: data.seo?.metaTitle || "",
                    "zh-TW": data.seo?.metaTitle || "",
                  },
            metaDescription:
              typeof data.seo?.metaDescription === "object"
                ? data.seo.metaDescription
                : {
                    en: data.seo?.metaDescription || "",
                    "zh-TW": data.seo?.metaDescription || "",
                  },
          },
        };
        if (!featuredPost || post._id !== featuredPost._id) {
          setFeaturedPost(post);
        }
      }
    } catch (error) {
      console.error("Error fetching featured post:", error);
      // Set featured post to null on error instead of throwing
      setFeaturedPost(null);
    }
  }, [featuredPost]);

  // Initial fetch
  useEffect(() => {
    fetchFeaturedPost();
  }, [fetchFeaturedPost]);

  return (
    <BlogContext.Provider
      value={{
        featuredPost,
        refreshFeaturedPost: fetchFeaturedPost,
      }}
    >
      {children}
    </BlogContext.Provider>
  );
};
