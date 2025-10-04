import { useEffect, useRef } from "react";
import Particles from "@/components/ui/Particle";
import { motion, useScroll, useTransform } from "framer-motion";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  ArrowRight,
  BookOpen,
  Users,
  Sparkles,
  Braces,
  Mic,
  Brain,
} from "lucide-react";
import Head from "next/head";

export default function LandingPage() {
  // References for scroll animations
  const targetRef = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({
    target: targetRef,
    offset: ["start end", "end start"],
  });

  // Parallax effect values
  const y = useTransform(scrollYProgress, [0, 1], [0, -100]);
  const opacity = useTransform(scrollYProgress, [0, 0.5, 1], [1, 0.8, 0.6]);

  // Feature items
  const features = [
    {
      icon: <BookOpen className="h-10 w-10 text-purple-500" />,
      title: "Learn LaTeX Naturally",
      description:
        "Convert natural language to LaTeX without memorizing complex syntax.",
    },
    {
      icon: <Mic className="h-10 w-10 text-pink-500" />,
      title: "Voice to LaTeX",
      description:
        "Speak mathematical equations and see them rendered in real-time.",
    },
    {
      icon: <Users className="h-10 w-10 text-blue-500" />,
      title: "Collaborative Learning",
      description: "Work together with classmates and teachers in real-time.",
    },
    {
      icon: <Sparkles className="h-10 w-10 text-amber-500" />,
      title: "Instant Preview",
      description: "See your LaTeX equations rendered as you type or speak.",
    },
    {
      icon: <Braces className="h-10 w-10 text-green-500" />,
      title: "Math Made Easy",
      description:
        "Complex mathematical notations simplified for students of all levels.",
    },
    {
      icon: <Brain className="h-10 w-10 text-red-500" />,
      title: "AI-Powered",
      description:
        "Intelligent conversion from natural language to precise LaTeX code.",
    },
  ];

  // Testimonials
  const testimonials = [
    {
      quote:
        "Vatex transformed how I teach calculus. My students can focus on understanding concepts rather than LaTeX syntax.",
      author: "Dr. Someone, Mathematics Professor",
    },
  ];

  return (
    <>
      <Head>
        <title>Vatex - Voice to LaTeX | Educational Whiteboarding</title>
        <meta
          name="description"
          content="Transform voice and natural language to LaTeX with real-time collaboration for educational purposes."
        />
      </Head>

      <div className="min-h-screen flex flex-col">
        {/* Hero Section */}
        <section className="relative h-screen flex items-center justify-center overflow-hidden">
          <motion.div
            className="absolute inset-0 z-0"
            style={{ y, opacity }}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 1 }}
          >
            <div className="absolute inset-0 bg-black opacity-90"></div>
            <div className="absolute inset-0 bg-[url('/math-bg.jpg')] bg-cover bg-center mix-blend-overlay"></div>
            <div
              style={{ width: "100%", height: "100vh", position: "relative" }}
            >
              <Particles
                particleColors={["#ffffff", "#ffffff"]}
                particleCount={200}
                particleSpread={10}
                speed={0.1}
                particleBaseSize={100}
                moveParticlesOnHover={true}
                alphaParticles={false}
                disableRotation={false}
              />
            </div>
          </motion.div>

          <div className="container mx-auto px-4 z-10">
            <motion.div
              className="max-w-3xl mx-auto text-center text-white"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8 }}
            >
              <motion.h1
                className="text-5xl md:text-7xl font-bold mb-6"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, delay: 0.2 }}
              >
                Vatex
              </motion.h1>
              <motion.p
                className="text-xl md:text-2xl mb-8"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, delay: 0.4 }}
              >
                Transform your voice and natural language into beautiful LaTeX
                equations. Collaborate in real-time with your classmates and
                teachers.
              </motion.p>
              <motion.div
                className="flex flex-col sm:flex-row gap-4 justify-center"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, delay: 0.6 }}
              >
                <Link href="/login" passHref>
                  <Button
                    size="lg"
                    className="bg-white text-purple-600 hover:bg-gray-100"
                  >
                    Sign In
                  </Button>
                </Link>
                <Link href="/dashboard" passHref>
                  <Button
                    size="lg"
                    variant="outline"
                    className="border-white text-black hover:bg-white/20"
                  >
                    Go to Dashboard
                  </Button>
                </Link>
              </motion.div>
            </motion.div>
          </div>

          <motion.div
            className="absolute bottom-10 left-1/2 transform -translate-x-1/2"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1.2, duration: 1 }}
            whileHover={{ y: 5 }}
            whileTap={{ scale: 0.9 }}
          >
            <a
              href="#features"
              className="text-white flex flex-col items-center"
            >
              <span className="mb-2">Learn More</span>
              <ArrowRight className="h-6 w-6 animate-bounce" />
            </a>
          </motion.div>
        </section>

        {/* Features Section */}
        <section id="features" ref={targetRef} className="py-20 bg-gray-50">
          <div className="container mx-auto px-4">
            <motion.div
              className="text-center max-w-3xl mx-auto mb-16"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.8 }}
            >
              <h2 className="text-4xl font-bold mb-4 text-gray-900">
                Educational Features
              </h2>
              <p className="text-xl text-gray-600">
                Designed specifically for students and educators to make
                mathematical communication seamless.
              </p>
            </motion.div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {features.map((feature, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.5, delay: index * 0.1 }}
                >
                  <Card className="h-full hover:shadow-lg transition-shadow duration-300">
                    <CardContent className="p-6 flex flex-col items-center text-center">
                      <motion.div
                        className="mb-4"
                        whileHover={{ scale: 1.1, rotate: 5 }}
                        transition={{
                          type: "spring",
                          stiffness: 400,
                          damping: 10,
                        }}
                      >
                        {feature.icon}
                      </motion.div>
                      <h3 className="text-xl font-bold mb-2 text-gray-900">
                        {feature.title}
                      </h3>
                      <p className="text-gray-600">{feature.description}</p>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* Demo Section */}
        <section className="py-20 bg-white">
          <div className="container mx-auto px-4">
            <motion.div
              className="flex flex-col lg:flex-row items-center gap-12"
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 0.8 }}
            >
              <div className="lg:w-1/2">
                <motion.h2
                  className="text-4xl font-bold mb-6 text-gray-900"
                  initial={{ opacity: 0, x: -20 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.8 }}
                >
                  See Vatex in Action
                </motion.h2>
                <motion.p
                  className="text-xl text-gray-600 mb-8"
                  initial={{ opacity: 0, x: -20 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.8, delay: 0.2 }}
                >
                  Watch how easy it is to convert spoken mathematics into
                  beautifully rendered LaTeX equations. Perfect for lectures,
                  study groups, and remote learning.
                </motion.p>
                <motion.div
                  initial={{ opacity: 0, x: -20 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.8, delay: 0.4 }}
                >
                  <Link href="/dashboard" passHref>
                    <Button className="bg-gradient-to-r from-purple-500 to-pink-500 text-white">
                      Try It Now <ArrowRight className="ml-2 h-4 w-4" />
                    </Button>
                  </Link>
                </motion.div>
              </div>
              <motion.div
                className="lg:w-1/2 rounded-lg overflow-hidden shadow-2xl"
                initial={{ opacity: 0, scale: 0.9 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                transition={{ duration: 0.8 }}
              >
                <div className="aspect-w-16 aspect-h-9 bg-gray-200 rounded-lg flex items-center justify-center">
                  <div className="p-8 text-center">
                    <p className="text-gray-500 mb-4">Demo Video Placeholder</p>
                    <p className="text-sm text-gray-400">
                      A video showing Vatex's voice-to-LaTeX and collaborative
                      features would appear here
                    </p>
                  </div>
                </div>
              </motion.div>
            </motion.div>
          </div>
        </section>

        {/* Testimonials */}
        <section className="py-20 bg-gradient-to-r from-purple-400 via-pink-500 to-red-500 text-white">
          <div className="container mx-auto px-4">
            <motion.h2
              className="text-4xl font-bold mb-12 text-center"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.8 }}
            >
              What Educators and Students Say
            </motion.h2>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {testimonials.map((testimonial, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.5, delay: index * 0.2 }}
                >
                  <Card className="h-full bg-white/10 backdrop-blur-sm border-none">
                    <CardContent className="p-6">
                      <p className="text-lg mb-4 italic">
                        "{testimonial.quote}"
                      </p>
                      <p className="font-semibold">— {testimonial.author}</p>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="py-20 bg-gray-900 text-white">
          <div className="container mx-auto px-4 text-center">
            <motion.h2
              className="text-4xl font-bold mb-6"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.8 }}
            >
              Ready to Transform Your Mathematical Communication?
            </motion.h2>
            <motion.p
              className="text-xl mb-8 max-w-2xl mx-auto"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.8, delay: 0.2 }}
            >
              Join thousands of students and educators who are already using
              Vatex to make mathematics more accessible.
            </motion.p>
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.8, delay: 0.4 }}
            >
              <Link href="/dashboard" passHref>
                <Button
                  size="lg"
                  className="bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600"
                >
                  Get Started Now
                </Button>
              </Link>
            </motion.div>
          </div>
        </section>

        {/* Footer */}
        <footer className="py-8 bg-gray-800 text-gray-300">
          <div className="container mx-auto px-4">
            <div className="flex flex-col md:flex-row justify-between items-center">
              <div className="mb-4 md:mb-0">
                <h3 className="text-2xl font-bold text-white">Vatex</h3>
                <p>Voice to LaTeX Whiteboarding</p>
              </div>
              <div className="flex gap-8">
                <Link
                  href="/about"
                  className="hover:text-white transition-colors"
                >
                  About
                </Link>
                <Link
                  href="/privacy"
                  className="hover:text-white transition-colors"
                >
                  Privacy
                </Link>
                <Link
                  href="/terms"
                  className="hover:text-white transition-colors"
                >
                  Terms
                </Link>
                <Link
                  href="/contact"
                  className="hover:text-white transition-colors"
                >
                  Contact
                </Link>
              </div>
            </div>
            <div className="mt-8 pt-8 border-t border-gray-700 text-center">
              <p>© {new Date().getFullYear()} Vatex. All rights reserved.</p>
            </div>
          </div>
        </footer>
      </div>
    </>
  );
}
