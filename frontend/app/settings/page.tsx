"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ChangeEvent, FormEvent, useEffect, useRef, useState } from "react";

import { fetchCurrentUser, updateCurrentUser, uploadProfilePicture } from "@/lib/api";
import { clearSession, hasUnlockedProfilePhoto, patchSessionUser, readSession } from "@/lib/auth-session";
import type { Gender, PreferredGender } from "@/lib/types";

const MAX_UPLOAD_DIMENSION = 800;
const COMPRESSED_UPLOAD_QUALITY = 0.8;
const COUNTRY_OPTIONS = [
  { code: "GL", name: "Global", flag: "🌍" },
  { code: "US", name: "United States", flag: "🇺🇸" },
  { code: "GB", name: "United Kingdom", flag: "🇬🇧" },
  { code: "DE", name: "Germany", flag: "🇩🇪" },
  { code: "FR", name: "France", flag: "🇫🇷" },
  { code: "BA", name: "Bosnia and Herzegovina", flag: "🇧🇦" },
  { code: "RS", name: "Serbia", flag: "🇷🇸" },
  { code: "HR", name: "Croatia", flag: "🇭🇷" },
  { code: "ME", name: "Montenegro", flag: "🇲🇪" }
] as const;

function scaledDimensions(width: number, height: number): { width: number; height: number } {
  if (width <= MAX_UPLOAD_DIMENSION && height <= MAX_UPLOAD_DIMENSION) {
    return { width, height };
  }

  const scaleRatio = Math.min(MAX_UPLOAD_DIMENSION / width, MAX_UPLOAD_DIMENSION / height);
  return {
    width: Math.max(1, Math.round(width * scaleRatio)),
    height: Math.max(1, Math.round(height * scaleRatio))
  };
}

function drawImageToCanvas(
  file: File,
  targetWidth: number,
  targetHeight: number
): Promise<Blob> {
  return new Promise<Blob>((resolve, reject) => {
    const objectUrl = URL.createObjectURL(file);
    const image = new window.Image();

    image.onload = () => {
      try {
        const canvas = document.createElement("canvas");
        canvas.width = targetWidth;
        canvas.height = targetHeight;
        const context = canvas.getContext("2d");
        if (!context) {
          reject(new Error("Image compression failed: missing canvas context."));
          return;
        }
        context.drawImage(image, 0, 0, targetWidth, targetHeight);
        canvas.toBlob(
          (blob) => {
            if (!blob) {
              reject(new Error("Image compression failed: could not create output blob."));
              return;
            }
            resolve(blob);
          },
          "image/jpeg",
          COMPRESSED_UPLOAD_QUALITY
        );
      } finally {
        URL.revokeObjectURL(objectUrl);
      }
    };

    image.onerror = () => {
      URL.revokeObjectURL(objectUrl);
      reject(new Error("Image compression failed: image could not be decoded."));
    };

    image.src = objectUrl;
  });
}

async function compressProfileImage(file: File): Promise<File> {
  const objectUrl = URL.createObjectURL(file);
  let sourceWidth = 0;
  let sourceHeight = 0;

  try {
    const probeImage = new window.Image();
    const loadProbe = new Promise<void>((resolve, reject) => {
      probeImage.onload = () => {
        sourceWidth = probeImage.naturalWidth;
        sourceHeight = probeImage.naturalHeight;
        resolve();
      };
      probeImage.onerror = () => reject(new Error("Could not read selected image dimensions."));
    });
    probeImage.src = objectUrl;
    await loadProbe;
  } finally {
    URL.revokeObjectURL(objectUrl);
  }

  if (sourceWidth <= 0 || sourceHeight <= 0) {
    throw new Error("Selected image is invalid.");
  }

  const target = scaledDimensions(sourceWidth, sourceHeight);
  const compressedBlob = await drawImageToCanvas(file, target.width, target.height);
  const sanitizedName = file.name.replace(/\.[^/.]+$/, "").trim() || "profile";
  return new File([compressedBlob], `${sanitizedName}-compressed.jpg`, {
    type: "image/jpeg",
    lastModified: Date.now()
  });
}

export default function SettingsPage() {
  const router = useRouter();
  const [accessToken, setAccessToken] = useState<string | null>(null);
  const [name, setName] = useState("");
  const [countryCode, setCountryCode] = useState("GL");
  const [gender, setGender] = useState<Gender>("male");
  const [preferredGender, setPreferredGender] = useState<PreferredGender>("both");
  const [profileImageUrl, setProfileImageUrl] = useState("");
  const [isUploadingPhoto, setIsUploadingPhoto] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [uploadLockMessage, setUploadLockMessage] = useState<string | null>(null);
  const hiddenUploadInputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    const session = readSession();
    if (!session) {
      router.replace("/login");
      return;
    }

    setAccessToken(session.access_token);

    const loadUser = async () => {
      try {
        const me = await fetchCurrentUser(session.access_token);
        setName(me.name);
        setCountryCode((me.country_code || "GL").toUpperCase());
        setGender(me.gender);
        setPreferredGender(me.preferred_gender);
        setProfileImageUrl(me.profile_image_url || "");
        patchSessionUser(me);
      } catch (loadError) {
        const message = loadError instanceof Error ? loadError.message : "Could not load settings.";
        setError(message);
      } finally {
        setIsLoading(false);
      }
    };

    void loadUser();
  }, [router]);

  useEffect(() => {
    if (!isUploadingPhoto) {
      return;
    }

    const beforeUnloadHandler = (event: BeforeUnloadEvent) => {
      event.preventDefault();
      event.returnValue = "";
    };

    const popStateHandler = () => {
      window.history.pushState(null, "", window.location.href);
      setUploadLockMessage("Upload is still running. Please wait for confirmation before leaving.");
    };

    window.history.pushState(null, "", window.location.href);
    window.addEventListener("beforeunload", beforeUnloadHandler);
    window.addEventListener("popstate", popStateHandler);
    return () => {
      window.removeEventListener("beforeunload", beforeUnloadHandler);
      window.removeEventListener("popstate", popStateHandler);
    };
  }, [isUploadingPhoto]);

  const saveSettings = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!accessToken) {
      return;
    }

    setError(null);
    setSuccess(null);
    setIsSaving(true);

    try {
      const updatedUser = await updateCurrentUser(
        {
          name: name.trim(),
          country_code: countryCode,
          gender,
          preferred_gender: preferredGender
        },
        accessToken
      );
      patchSessionUser(updatedUser);
      setProfileImageUrl(updatedUser.profile_image_url || "");
      setSuccess("Profile saved.");
    } catch (saveError) {
      const message = saveError instanceof Error ? saveError.message : "Could not save profile.";
      setError(message);
    } finally {
      setIsSaving(false);
    }
  };

  const unlocked = hasUnlockedProfilePhoto(profileImageUrl);

  const triggerUploadPicker = () => {
    hiddenUploadInputRef.current?.click();
  };

  const handleProfileFileChange = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file || !accessToken) {
      return;
    }

    setError(null);
    setSuccess(null);
    setIsUploadingPhoto(true);
    setUploadLockMessage("Optimizing image and uploading profile photo...");
    try {
      const optimizedFile = await compressProfileImage(file);
      const updatedUser = await uploadProfilePicture(optimizedFile, accessToken);
      patchSessionUser(updatedUser);
      setProfileImageUrl(updatedUser.profile_image_url || "");
      setSuccess("Profile photo verified and updated.");
    } catch (uploadError) {
      const message = uploadError instanceof Error ? uploadError.message : "Could not upload profile photo.";
      setError(message);
    } finally {
      setUploadLockMessage(null);
      setIsUploadingPhoto(false);
    }
  };

  const handleLogout = () => {
    clearSession();
    router.replace("/login");
  };

  return (
    <main className="mx-auto flex min-h-screen w-full max-w-md items-start px-3 py-4 md:justify-center md:py-8">
      <section
        className="w-full space-y-4 rounded-3xl border border-slate-700/50 bg-slate-950/65 p-4 shadow-2xl shadow-black/30 backdrop-blur-xl"
        style={{
          paddingTop: "max(env(safe-area-inset-top), 0.25rem)",
          paddingBottom: "max(env(safe-area-inset-bottom), 0.75rem)"
        }}
      >
        <header className="flex items-center justify-between">
          <p className="font-display text-3xl text-white">Settings</p>
          <Link
            href="/dashboard"
            className="min-h-11 min-w-11 rounded-xl border border-cyan-400/60 px-3 py-2 text-sm font-semibold text-cyan-100 transition hover:bg-cyan-900/40"
          >
            Back to Menu
          </Link>
        </header>

        <div className="rounded-2xl border border-slate-700/60 bg-slate-900/55 p-4">
          <button
            type="button"
            onClick={triggerUploadPicker}
            disabled={isLoading || isUploadingPhoto}
            className="group relative mx-auto block h-24 w-24 overflow-hidden rounded-full border border-slate-600 transition hover:scale-[1.02] disabled:cursor-not-allowed disabled:opacity-70"
            aria-label="Upload profile photo"
          >
            {unlocked ? (
              <Image src={profileImageUrl} alt="Profile preview" fill sizes="96px" className="object-cover" />
            ) : (
              <div className="flex h-full w-full items-center justify-center bg-slate-800 text-xs font-semibold text-orange-300">
                Upload Photo
              </div>
            )}
            <div className="absolute inset-0 flex items-end justify-center bg-black/0 pb-2 text-[11px] font-semibold text-white opacity-0 transition group-hover:bg-black/35 group-hover:opacity-100">
              Change
            </div>
          </button>
          <input
            ref={hiddenUploadInputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={handleProfileFileChange}
          />
          <p className="mt-3 text-center text-xs text-slate-300">
            Tap your photo circle to upload and verify a real face.
          </p>
          {isUploadingPhoto ? (
            <p className="mt-2 text-center text-xs text-cyan-200">Verifying face and uploading photo...</p>
          ) : null}
        </div>

        {isLoading && <p className="rounded-xl bg-slate-800/70 px-3 py-2 text-sm text-slate-200">Loading settings...</p>}

        <form onSubmit={saveSettings} className="space-y-4">
          <label className="block">
            <span className="mb-1 block text-sm font-medium text-slate-200">Display name</span>
            <input
              required
              type="text"
              value={name}
              onChange={(event) => setName(event.target.value)}
              className="min-h-11 w-full rounded-xl border border-slate-600 bg-slate-900/70 px-3 text-slate-100 outline-none ring-cyan-400 transition focus:ring"
            />
          </label>

          <div className="grid grid-cols-2 gap-3">
            <label className="block">
              <span className="mb-1 block text-sm font-medium text-slate-200">Country</span>
              <select
                value={countryCode}
                onChange={(event) => setCountryCode(event.target.value)}
                className="min-h-11 w-full rounded-xl border border-slate-600 bg-slate-900/70 px-3 text-slate-100 outline-none ring-cyan-400 transition focus:ring"
              >
                {COUNTRY_OPTIONS.map((country) => (
                  <option key={country.code} value={country.code}>
                    {country.flag} {country.name}
                  </option>
                ))}
              </select>
            </label>
            <label className="block">
              <span className="mb-1 block text-sm font-medium text-slate-200">Gender</span>
              <select
                value={gender}
                onChange={(event) => setGender(event.target.value as Gender)}
                className="min-h-11 w-full rounded-xl border border-slate-600 bg-slate-900/70 px-3 text-slate-100 outline-none ring-cyan-400 transition focus:ring"
              >
                <option value="male">Male</option>
                <option value="female">Female</option>
              </select>
            </label>

            <label className="block">
              <span className="mb-1 block text-sm font-medium text-slate-200">Preferred gender</span>
              <select
                value={preferredGender}
                onChange={(event) => setPreferredGender(event.target.value as PreferredGender)}
                className="min-h-11 w-full rounded-xl border border-slate-600 bg-slate-900/70 px-3 text-slate-100 outline-none ring-cyan-400 transition focus:ring"
              >
                <option value="both">Both</option>
                <option value="male">Male</option>
                <option value="female">Female</option>
              </select>
            </label>
          </div>

          {error && <p className="rounded-xl bg-red-500/20 px-3 py-2 text-sm text-red-200">{error}</p>}
          {success && <p className="rounded-xl bg-emerald-500/20 px-3 py-2 text-sm text-emerald-200">{success}</p>}

          <button
            type="submit"
            disabled={isSaving || isLoading || isUploadingPhoto}
            className="min-h-11 w-full rounded-xl border border-cyan-300/60 bg-cyan-400/15 px-4 text-sm font-semibold text-cyan-100 transition hover:bg-cyan-400/25 disabled:opacity-60"
          >
            {isSaving ? "Saving..." : "Save settings"}
          </button>

          <button
            type="button"
            onClick={handleLogout}
            className="min-h-11 w-full rounded-xl border border-red-400/60 bg-red-500/20 px-4 text-sm font-semibold text-red-100 transition hover:bg-red-500/30"
          >
            Logout
          </button>
        </form>
      </section>

      {isUploadingPhoto ? (
        <div className="fixed inset-0 z-[180] flex items-center justify-center bg-[#020617]/65 backdrop-blur-md pointer-events-auto">
          <div className="w-[90%] max-w-sm rounded-2xl border border-cyan-300/30 bg-[#081633]/95 px-4 py-5 text-center shadow-[0_30px_90px_rgba(2,8,22,0.75)]">
            <span
              aria-hidden="true"
              className="mx-auto mb-3 block h-9 w-9 animate-spin rounded-full border-[3px] border-cyan-200/35 border-t-cyan-100"
            />
            <p className="text-sm font-semibold text-cyan-100">
              Upload in progress
            </p>
            <p className="mt-1 text-xs text-slate-300">
              {uploadLockMessage ?? "Please wait while we save your profile image."}
            </p>
          </div>
        </div>
      ) : null}
    </main>
  );
}
