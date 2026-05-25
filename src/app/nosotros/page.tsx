"use client";

import Navbar from "@/components/landing/Navbar";
import Footer from "@/components/landing/Footer";

import AboutHero from "@/components/landing/about/AboutHero";
import TimelineCard from "@/components/landing/about/TimelineCard";
import MissionVision from "@/components/landing/about/MissionVision";
import ValuesSection from "@/components/landing/about/ValuesSection";

export default function NosotrosPage() {
  return (
    <div
      className="min-h-screen flex flex-col"
    >
      <Navbar />

      <main className="flex-1 pt-32">

        <AboutHero />

        <TimelineCard />

        <MissionVision />

        <ValuesSection />

      </main>

      <Footer />
    </div>
  );
}