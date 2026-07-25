export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];

export type Database = {
  public: {
    Tables: {
      article_vocabulary_items: {
        Row: {
          article_id: string;
          created_at: string;
          example: string | null;
          id: string;
          meaning: string | null;
          reading: string | null;
          word: string;
        };
        Insert: {
          article_id: string;
          created_at?: string;
          example?: string | null;
          id?: string;
          meaning?: string | null;
          reading?: string | null;
          word: string;
        };
        Update: {
          article_id?: string;
          created_at?: string;
          example?: string | null;
          id?: string;
          meaning?: string | null;
          reading?: string | null;
          word?: string;
        };
        Relationships: [];
      };
      articles: {
        Row: {
          body: string;
          created_at: string;
          created_by: string | null;
          id: string;
          level: string;
          student_id: string;
          title: string;
          topic: string;
          updated_at: string;
        };
        Insert: {
          body: string;
          created_at?: string;
          created_by?: string | null;
          id?: string;
          level: string;
          student_id: string;
          title: string;
          topic: string;
          updated_at?: string;
        };
        Update: {
          body?: string;
          created_at?: string;
          created_by?: string | null;
          id?: string;
          level?: string;
          student_id?: string;
          title?: string;
          topic?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      corrections: {
        Row: {
          after_text: string;
          before_text: string;
          created_at: string;
          created_by: string | null;
          id: string;
          note: string | null;
          writing_id: string;
        };
        Insert: {
          after_text: string;
          before_text: string;
          created_at?: string;
          created_by?: string | null;
          id?: string;
          note?: string | null;
          writing_id: string;
        };
        Update: {
          after_text?: string;
          before_text?: string;
          created_at?: string;
          created_by?: string | null;
          id?: string;
          note?: string | null;
          writing_id?: string;
        };
        Relationships: [];
      };
      profiles: {
        Row: {
          created_at: string;
          display_name: string;
          email: string | null;
          id: string;
          role: "student" | "teacher";
          updated_at: string;
        };
        Insert: {
          created_at?: string;
          display_name: string;
          email?: string | null;
          id: string;
          role: "student" | "teacher";
          updated_at?: string;
        };
        Update: {
          created_at?: string;
          display_name?: string;
          email?: string | null;
          id?: string;
          role?: "student" | "teacher";
          updated_at?: string;
        };
        Relationships: [];
      };
      questions: {
        Row: {
          body: string;
          created_at: string;
          id: string;
          label: string | null;
          selected_sentence: string | null;
          selected_text: string | null;
          speaker: "student" | "teacher";
          writing_id: string;
        };
        Insert: {
          body: string;
          created_at?: string;
          id?: string;
          label?: string | null;
          selected_sentence?: string | null;
          selected_text?: string | null;
          speaker: "student" | "teacher";
          writing_id: string;
        };
        Update: {
          body?: string;
          created_at?: string;
          id?: string;
          label?: string | null;
          selected_sentence?: string | null;
          selected_text?: string | null;
          speaker?: "student" | "teacher";
          writing_id?: string;
        };
        Relationships: [];
      };
      students: {
        Row: {
          created_at: string;
          id: string;
          interest: string | null;
          level: string | null;
          name: string;
          next_lesson_focus: string | null;
          profile_id: string | null;
          updated_at: string;
        };
        Insert: {
          created_at?: string;
          id?: string;
          interest?: string | null;
          level?: string | null;
          name: string;
          next_lesson_focus?: string | null;
          profile_id?: string | null;
          updated_at?: string;
        };
        Update: {
          created_at?: string;
          id?: string;
          interest?: string | null;
          level?: string | null;
          name?: string;
          next_lesson_focus?: string | null;
          profile_id?: string | null;
          updated_at?: string;
        };
        Relationships: [];
      };
      teacher_students: {
        Row: {
          created_at: string;
          id: string;
          student_id: string;
          teacher_id: string;
        };
        Insert: {
          created_at?: string;
          id?: string;
          student_id: string;
          teacher_id: string;
        };
        Update: {
          created_at?: string;
          id?: string;
          student_id?: string;
          teacher_id?: string;
        };
        Relationships: [];
      };
      vocabulary_items: {
        Row: {
          article_id: string | null;
          created_at: string;
          example: string | null;
          id: string;
          meaning: string | null;
          reading: string | null;
          source_sentence: string | null;
          student_id: string;
          word: string;
          writing_id: string | null;
        };
        Insert: {
          article_id?: string | null;
          created_at?: string;
          example?: string | null;
          id?: string;
          meaning?: string | null;
          reading?: string | null;
          source_sentence?: string | null;
          student_id: string;
          word: string;
          writing_id?: string | null;
        };
        Update: {
          article_id?: string | null;
          created_at?: string;
          example?: string | null;
          id?: string;
          meaning?: string | null;
          reading?: string | null;
          source_sentence?: string | null;
          student_id?: string;
          word?: string;
          writing_id?: string | null;
        };
        Relationships: [];
      };
      vocabulary_test_results: {
        Row: {
          answer: string;
          article_vocabulary_item_id: string | null;
          created_at: string;
          id: string;
          judgement: "correct" | "close" | "incorrect";
          judgement_label: string;
          judgement_message: string | null;
          learner_sentence: string | null;
          meaning: string | null;
          reading: string | null;
          session_id: string;
          source_id: string;
          source_type: "writing" | "article";
          student_id: string;
          vocabulary_item_id: string | null;
          word: string;
        };
        Insert: {
          answer?: string;
          article_vocabulary_item_id?: string | null;
          created_at?: string;
          id?: string;
          judgement: "correct" | "close" | "incorrect";
          judgement_label: string;
          judgement_message?: string | null;
          learner_sentence?: string | null;
          meaning?: string | null;
          reading?: string | null;
          session_id: string;
          source_id: string;
          source_type: "writing" | "article";
          student_id: string;
          vocabulary_item_id?: string | null;
          word: string;
        };
        Update: {
          answer?: string;
          article_vocabulary_item_id?: string | null;
          created_at?: string;
          id?: string;
          judgement?: "correct" | "close" | "incorrect";
          judgement_label?: string;
          judgement_message?: string | null;
          learner_sentence?: string | null;
          meaning?: string | null;
          reading?: string | null;
          session_id?: string;
          source_id?: string;
          source_type?: "writing" | "article";
          student_id?: string;
          vocabulary_item_id?: string | null;
          word?: string;
        };
        Relationships: [];
      };
      vocabulary_test_sessions: {
        Row: {
          close_count: number;
          correct_count: number;
          created_at: string;
          created_by_role: "teacher" | "student";
          id: string;
          incorrect_count: number;
          source_ids: string[];
          source_titles: string[];
          student_id: string;
          total_count: number;
        };
        Insert: {
          close_count?: number;
          correct_count?: number;
          created_at?: string;
          created_by_role?: "teacher" | "student";
          id?: string;
          incorrect_count?: number;
          source_ids?: string[];
          source_titles?: string[];
          student_id: string;
          total_count?: number;
        };
        Update: {
          close_count?: number;
          correct_count?: number;
          created_at?: string;
          created_by_role?: "teacher" | "student";
          id?: string;
          incorrect_count?: number;
          source_ids?: string[];
          source_titles?: string[];
          student_id?: string;
          total_count?: number;
        };
        Relationships: [];
      };
      writings: {
        Row: {
          created_at: string;
          draft: string;
          furigana_preview: string | null;
          id: string;
          student_id: string;
          title: string;
          updated_at: string;
        };
        Insert: {
          created_at?: string;
          draft: string;
          furigana_preview?: string | null;
          id?: string;
          student_id: string;
          title: string;
          updated_at?: string;
        };
        Update: {
          created_at?: string;
          draft?: string;
          furigana_preview?: string | null;
          id?: string;
          student_id?: string;
          title?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: Record<string, never>;
    CompositeTypes: Record<string, never>;
  };
};
