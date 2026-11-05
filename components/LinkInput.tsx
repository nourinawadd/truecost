"use client";

import { useState, type FormEvent } from "react";

type Props = {
  value: string;
  onChange(value: string): void;
  onSubmit(url: URL): void;
  disabled: boolean;
};

// The link box and the CHECK button. A form, so Enter submits. We check the
// link looks like one here; the server checks it properly again.
export function LinkInput({ value, onChange, onSubmit, disabled }: Props) {
  const [invalid, setInvalid] = useState(false);

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const url = toUrl(value);
    setInvalid(!url);
    if (url) onSubmit(url);
  }

  return (
    <form noValidate onSubmit={submit} className="flex max-w-[720px] flex-col gap-2.5">
      <label htmlFor="link" className="text-label">
        PRODUCT LINK
      </label>
      <div className="flex flex-wrap">
        <input
          id="link"
          type="url"
          inputMode="url"
          autoComplete="off"
          placeholder="https://"
          value={value}
          onChange={(event) => {
            onChange(event.target.value);
            setInvalid(false);
          }}
          disabled={disabled}
          aria-invalid={invalid}
          aria-describedby={invalid ? "link-error" : undefined}
          className="h-14 min-w-0 flex-[1_1_280px] border border-ink bg-field px-4 text-[15px]"
        />
        <button
          type="submit"
          disabled={disabled}
          className="flex h-14 items-center gap-3 bg-ink px-7 text-[13px] tracking-[0.1em] text-paper disabled:opacity-60"
        >
          CHECK <span aria-hidden="true">[→]</span>
        </button>
      </div>
      {invalid && (
        <p id="link-error" className="text-[13px] text-red">
          <span aria-hidden="true">[×]</span> that doesn&apos;t look like a link.
        </p>
      )}
    </form>
  );
}

// "shop.com/x" → https://shop.com/x. Only http(s) links with a dot in the
// host count, so "hello" or "localhost" are caught before calling the API.
function toUrl(raw: string): URL | null {
  const text = raw.trim();
  if (!text) return null;

  try {
    const url = new URL(/^[a-z]+:\/\//i.test(text) ? text : `https://${text}`);
    const http = url.protocol === "http:" || url.protocol === "https:";
    return http && url.hostname.includes(".") ? url : null;
  } catch {
    return null;
  }
}
