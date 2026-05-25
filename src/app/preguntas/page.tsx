"use client";

import Navbar from "@/components/landing/Navbar";
import Footer from "@/components/landing/Footer";

import QuestionsHero from "@/components/landing/questions/QuestionsHero";
import QuestionsAccordion from "@/components/landing/questions/QuestionsAccordion";
import QuestionsCTA from "@/components/landing/questions/QuestionsCTA";

export default function PreguntasPage() {
  return (
    <div
      className="min-h-screen flex flex-col"
    >
      <Navbar />

      <main className="flex-1 pt-32">

        <QuestionsHero />

        <QuestionsAccordion />

        <QuestionsCTA />

      </main>

      <Footer />
    </div>
  );
}