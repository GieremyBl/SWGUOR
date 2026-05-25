"use client";

import Navbar from "@/components/landing/Navbar";
import Footer from "@/components/landing/Footer";

import CollectionsHero from "@/components/landing/collections/CollectionsHero";
import CollectionsGrid from "@/components/landing/collections/CollectionsGrid";
import CollectionsBanner from "@/components/landing/collections/CollectionsBanner";
import CollectionsCTA from "@/components/landing/collections/CollectionsCTA";

export default function ColeccionesPage() {
  return (
    <div
      className="min-h-screen flex flex-col"
    >
      <Navbar />

      <main className="flex-1 pt-32">

        <CollectionsHero />

        <CollectionsGrid />

        <CollectionsBanner />

        <CollectionsCTA />

      </main>

      <Footer />
    </div>
  );
}