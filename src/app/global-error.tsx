"use client";

export default function GlobalError({
  retry,
}: {
  error: Error & { digest?: string };
  retry: () => void;
}) {
  return (
    <html lang="en">
      <body>
        <main>
          <h1>Unable to open Dynamatrix Flow</h1>
          <p>Please try again.</p>
          <button onClick={retry}>Try again</button>
        </main>
      </body>
    </html>
  );
}
