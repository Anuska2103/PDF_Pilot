"use client";

import React, { useEffect, useState } from "react";
import axios from "axios";
import { useRouter } from "next/navigation";
import { FileText, Mic, Presentation, Play, ArrowLeft, BarChart2 } from "lucide-react";

const API_BASE = "https://pdf-pilot-pvvs.onrender.com";

interface SessionRecord {
  session_id: string;
  filename: string;
  upload_time: string | null;
  text_length: number;
  has_summary: boolean;
  has_audio_overview: boolean;
  has_podcast: boolean;
  has_ppt: boolean;
}

interface AnalyticsData {
  user_id: string;
  total_uploads: number;
  sessions: SessionRecord[];
}

function FeatureBadge({ active, label }: { active: boolean; label: string }) {
  return (
    <span
      className={`inline-block text-xs px-2 py-0.5 rounded-full font-medium ${
        active
          ? "bg-emerald-900 text-emerald-300 border border-emerald-700"
          : "bg-zinc-800 text-zinc-600 border border-zinc-700"
      }`}
    >
      {label}
    </span>
  );
}

export default function AnalyticsPage() {
  const router = useRouter();
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [username, setUsername] = useState<string>("");

  useEffect(() => {
    async function load() {
      try {
        // Get current user from server-side JWT
        const meRes = await axios.get("/api/users/me");
        const { id, username: uname } = meRes.data;
        setUsername(uname);

        // Fetch analytics for this user from FastAPI
        const analyticsRes = await axios.get(`${API_BASE}/analytics/${id}`);
        setData(analyticsRes.data);
      } catch (err: any) {
        if (err.response?.status === 401) {
          router.push("/login");
        } else {
          setError("Failed to load analytics data.");
        }
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [router]);

  if (loading) {
    return (
      <div className="min-h-screen bg-zinc-950 flex items-center justify-center text-zinc-400">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-2 border-sky-500 border-t-transparent rounded-full animate-spin" />
          <p>Loading analytics…</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-zinc-950 flex items-center justify-center text-red-400">
        <p>{error}</p>
      </div>
    );
  }

  const sessions = data?.sessions ?? [];
  const summaryCount = sessions.filter(s => s.has_summary).length;
  const audioCount = sessions.filter(s => s.has_audio_overview).length;
  const podcastCount = sessions.filter(s => s.has_podcast).length;
  const pptCount = sessions.filter(s => s.has_ppt).length;
  const avgLength =
    sessions.length > 0
      ? Math.round(sessions.reduce((acc, s) => acc + s.text_length, 0) / sessions.length)
      : 0;

  return (
    <div className="min-h-screen bg-zinc-950 text-white p-6">
      {/* Header */}
      <div className="max-w-6xl mx-auto">
        <div className="flex items-center gap-4 mb-8">
          <button
            onClick={() => router.push("/dashboard")}
            className="p-2 bg-zinc-800 hover:bg-zinc-700 rounded-full transition text-zinc-400 hover:text-white"
            title="Back to Dashboard"
          >
            <ArrowLeft size={18} />
          </button>
          <div>
            <h1 className="text-2xl font-bold flex items-center gap-2">
              <BarChart2 size={24} className="text-sky-400" />
              Analytics Dashboard
            </h1>
            <p className="text-zinc-400 text-sm mt-0.5">
              Showing activity for <span className="text-sky-300 font-medium">{username}</span>
            </p>
          </div>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 mb-8">
          {[
            { label: "Total Uploads", value: data?.total_uploads ?? 0, color: "text-white" },
            { label: "Summaries", value: summaryCount, color: "text-purple-400" },
            { label: "Audio Overviews", value: audioCount, color: "text-blue-400" },
            { label: "Podcasts", value: podcastCount, color: "text-pink-400" },
            { label: "PPT Outlines", value: pptCount, color: "text-orange-400" },
            { label: "Avg. Doc Length", value: `${avgLength.toLocaleString()} ch`, color: "text-emerald-400" },
          ].map(card => (
            <div key={card.label} className="bg-zinc-900 border border-zinc-800 rounded-xl p-4 flex flex-col gap-1">
              <p className="text-zinc-500 text-xs uppercase tracking-wide">{card.label}</p>
              <p className={`text-2xl font-bold ${card.color}`}>{card.value}</p>
            </div>
          ))}
        </div>

        {/* Sessions Table */}
        {sessions.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-24 text-zinc-600">
            <FileText size={40} className="mb-4" />
            <p className="text-lg">No documents uploaded yet.</p>
            <button
              onClick={() => router.push("/dashboard")}
              className="mt-4 px-4 py-2 bg-sky-600 hover:bg-sky-500 rounded-full text-sm transition"
            >
              Upload your first PDF
            </button>
          </div>
        ) : (
          <div className="bg-zinc-900 border border-zinc-800 rounded-2xl overflow-hidden">
            <div className="px-6 py-4 border-b border-zinc-800">
              <h2 className="font-semibold text-zinc-300">Upload History</h2>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-zinc-800 text-zinc-500 text-xs uppercase tracking-wide">
                    <th className="text-left px-6 py-3">Filename</th>
                    <th className="text-left px-6 py-3">Uploaded</th>
                    <th className="text-right px-6 py-3">Doc Size</th>
                    <th className="text-left px-6 py-3">Features Used</th>
                    <th className="text-left px-6 py-3">Session ID</th>
                  </tr>
                </thead>
                <tbody>
                  {sessions.map((session, idx) => (
                    <tr
                      key={session.session_id}
                      className={`border-b border-zinc-800/60 hover:bg-zinc-800/40 transition ${
                        idx === sessions.length - 1 ? "border-none" : ""
                      }`}
                    >
                      <td className="px-6 py-4 font-medium text-white">
                        <div className="flex items-center gap-2">
                          <FileText size={14} className="text-zinc-500 flex-shrink-0" />
                          <span className="truncate max-w-[180px]" title={session.filename}>
                            {session.filename}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-zinc-400">
                        {session.upload_time
                          ? new Date(session.upload_time).toLocaleString()
                          : "—"}
                      </td>
                      <td className="px-6 py-4 text-right text-zinc-400">
                        {session.text_length.toLocaleString()} ch
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex flex-wrap gap-1.5">
                          <FeatureBadge active={session.has_summary} label="Summary" />
                          <FeatureBadge active={session.has_audio_overview} label="Audio" />
                          <FeatureBadge active={session.has_podcast} label="Podcast" />
                          <FeatureBadge active={session.has_ppt} label="PPT" />
                        </div>
                      </td>
                      <td className="px-6 py-4 text-zinc-600 font-mono text-xs">
                        {session.session_id.slice(0, 8)}…
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
