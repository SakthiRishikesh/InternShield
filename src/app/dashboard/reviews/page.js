"use client";

import { useCallback, useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import ReviewCard from "@/components/features/review/ReviewCard";
import { api } from "@/lib/api";
import { openEventStream } from "@/lib/realtime";

export default function ReviewsPage() {
  const [reviews, setReviews] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingReview, setEditingReview] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [formData, setFormData] = useState({ company: "", rating: 5, review: "", status: "Safe" });
  const [formError, setFormError] = useState("");
  const [pageLoading, setPageLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  const fetchReviews = useCallback(async () => {
    try {
      const params = {};
      if (searchTerm.trim()) params.search = searchTerm.trim();
      const data = await api.reviews.list(params);
      setReviews(data.reviews || []);
    } catch {
      // silently fail
    } finally {
      setPageLoading(false);
    }
  }, [searchTerm]);

  useEffect(() => {
    fetchReviews();
  }, [fetchReviews]);

  useEffect(() => {
    const params = new URLSearchParams();
    if (searchTerm.trim()) params.set("search", searchTerm.trim());
    const closeStream = openEventStream(`/api/reviews/events?${params.toString()}`, {
      events: {
        reviews: (payload) => {
          setReviews(payload.reviews || []);
          setPageLoading(false);
        },
      },
    });

    return closeStream;
  }, [searchTerm]);

  const handleOpenModal = (review = null) => {
    if (review) {
      setEditingReview(review);
      setFormData({
        company: review.company,
        rating: review.rating,
        review: review.review,
        status: review.status,
      });
    } else {
      setEditingReview(null);
      setFormData({ company: "", rating: 5, review: "", status: "Safe" });
    }

    setFormError("");
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingReview(null);
    setFormData({ company: "", rating: 5, review: "", status: "Safe" });
    setFormError("");
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (!formData.company.trim() || formData.company.trim().length < 2) {
      setFormError("Company name is required.");
      return;
    }

    if (!formData.review.trim() || formData.review.trim().length < 20) {
      setFormError("Review must be at least 20 characters.");
      return;
    }

    setSubmitting(true);
    setFormError("");

    try {
      if (editingReview) {
        const data = await api.reviews.update(editingReview.id, formData);
        setReviews((current) =>
          current.map((r) => (r.id === editingReview.id ? data.review : r))
        );
      } else {
        const data = await api.reviews.create(formData);
        setReviews((current) => [data.review, ...current]);
      }

      handleCloseModal();
    } catch (err) {
      setFormError(err.message || "Failed to save review.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id) => {
    if (!confirm("Are you sure you want to delete this review?")) return;

    try {
      await api.reviews.delete(id);
      setReviews((current) => current.filter((r) => r.id !== id));
    } catch {
      // silently fail
    }
  };

  return (
    <div className="min-h-screen bg-black font-sans text-white selection:bg-cyan-500/30">
      <div className="mx-auto max-w-6xl px-6 pb-20 pt-28">
        <div className="mb-12 flex flex-col justify-between gap-6 md:flex-row md:items-center">
          <div>
            <h1 className="mb-2 text-4xl font-black tracking-tight">
              Community <span className="text-cyan-500">Pulse</span>
            </h1>
            <p className="text-sm text-gray-500">
              Real experiences from interns across the globe — stored and synced in real time.
            </p>
          </div>

          <div className="flex items-center gap-4">
            <div className="relative group">
              <input
                type="text"
                placeholder="Search companies..."
                value={searchTerm}
                onChange={(event) => setSearchTerm(event.target.value)}
                className="w-64 rounded-2xl border border-white/10 bg-white/5 px-6 py-3 text-sm transition-all focus:border-cyan-500 focus:outline-none"
              />
              <span className="absolute right-4 top-1/2 -translate-y-1/2 text-[10px] font-bold uppercase tracking-[0.3em] text-gray-500">
                Find
              </span>
            </div>

            <button
              onClick={() => handleOpenModal()}
              className="rounded-2xl bg-cyan-500 px-6 py-3 text-sm font-black uppercase tracking-widest text-black shadow-xl shadow-cyan-500/20 transition-all hover:scale-105"
            >
              Post Review
            </button>
          </div>
        </div>

        {pageLoading ? (
          <div className="flex items-center justify-center py-20">
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
              className="h-8 w-8 rounded-full border-2 border-cyan-500/20 border-t-cyan-500"
            />
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
            <AnimatePresence>
              {reviews.map((review) => (
                <motion.div
                  key={review.id}
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.9 }}
                  layout
                >
                  <ReviewCard
                    {...review}
                    onEdit={() => handleOpenModal(review)}
                    onDelete={() => handleDelete(review.id)}
                  />
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        )}

        {!pageLoading && reviews.length === 0 && (
          <div className="py-20 text-center opacity-30">
            <div className="mb-4 text-xl font-black uppercase tracking-[0.3em]">
              Empty
            </div>
            <p className="text-xl font-bold uppercase tracking-widest">
              No reviews found
            </p>
          </div>
        )}
      </div>

      <AnimatePresence>
        {isModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-6">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={handleCloseModal}
              className="absolute inset-0 bg-black/80 backdrop-blur-md"
            />

            <motion.div
              initial={{ opacity: 0, y: 50, scale: 0.9 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 50, scale: 0.9 }}
              className="relative w-full max-w-lg rounded-3xl border border-white/10 bg-gray-900 p-8 shadow-2xl"
            >
              <h2 className="mb-6 text-2xl font-bold">
                {editingReview ? "Edit Experience" : "Share Experience"}
              </h2>

              <form onSubmit={handleSubmit} className="space-y-6">
                <div>
                  <label className="mb-2 block text-[10px] font-bold uppercase tracking-widest text-gray-500">
                    Company Name
                  </label>
                  <input
                    type="text"
                    value={formData.company}
                    onChange={(event) =>
                      setFormData((d) => ({ ...d, company: event.target.value }))
                    }
                    className="w-full rounded-xl border border-white/10 bg-black/40 px-4 py-3 text-sm transition-all focus:border-cyan-500 focus:outline-none"
                    placeholder="e.g. Google, TechNova"
                  />
                </div>

                <div className="grid grid-cols-2 gap-6">
                  <div>
                    <label className="mb-2 block text-[10px] font-bold uppercase tracking-widest text-gray-500">
                      Rating
                    </label>
                    <select
                      value={formData.rating}
                      onChange={(event) =>
                        setFormData((d) => ({ ...d, rating: Number(event.target.value) }))
                      }
                      className="w-full appearance-none rounded-xl border border-white/10 bg-black/40 px-4 py-3 text-sm transition-all focus:border-cyan-500 focus:outline-none"
                    >
                      {[5, 4, 3, 2, 1].map((rating) => (
                        <option key={rating} value={rating}>
                          {rating} Stars
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="mb-2 block text-[10px] font-bold uppercase tracking-widest text-gray-500">
                      Verdict
                    </label>
                    <select
                      value={formData.status}
                      onChange={(event) =>
                        setFormData((d) => ({ ...d, status: event.target.value }))
                      }
                      className="w-full appearance-none rounded-xl border border-white/10 bg-black/40 px-4 py-3 text-sm transition-all focus:border-cyan-500 focus:outline-none"
                    >
                      <option value="Safe">Safe</option>
                      <option value="Warning">Warning</option>
                      <option value="Scam">Scam</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="mb-2 block text-[10px] font-bold uppercase tracking-widest text-gray-500">
                    Your Review
                  </label>
                  <textarea
                    value={formData.review}
                    onChange={(event) =>
                      setFormData((d) => ({ ...d, review: event.target.value }))
                    }
                    className="h-32 w-full resize-none rounded-xl border border-white/10 bg-black/40 p-4 text-sm transition-all focus:border-cyan-500 focus:outline-none"
                    placeholder="Tell us about the recruitment process, culture, and any red flags..."
                  />
                </div>

                {formError && (
                  <p className="rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-300">
                    {formError}
                  </p>
                )}

                <div className="flex gap-4 pt-4">
                  <button
                    type="button"
                    onClick={handleCloseModal}
                    className="flex-1 rounded-xl border border-white/10 py-4 text-xs font-bold uppercase tracking-widest transition-all hover:bg-white/5"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={submitting}
                    className="flex-1 rounded-xl bg-cyan-500 py-4 text-xs font-black uppercase tracking-widest text-black transition-all hover:bg-cyan-400 disabled:opacity-50"
                  >
                    {submitting
                      ? "Saving..."
                      : editingReview
                        ? "Update Review"
                        : "Publish Review"}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
