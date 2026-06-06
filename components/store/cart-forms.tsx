"use client";

import { useState, useTransition } from "react";
import { Minus, Plus } from "lucide-react";
import { useRouter } from "next/navigation";

import { updateCartItemAction } from "@/app/actions/cart";
import { emptyActionState } from "@/lib/action-state";

export function CartQuantityForm({
  cartItemId,
  quantity
}: {
  cartItemId: string;
  quantity: number;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const safeMax = 99;
  const [currentQuantity, setCurrentQuantity] = useState(() => clampQuantity(quantity, safeMax));
  const [savedQuantity, setSavedQuantity] = useState(() => clampQuantity(quantity, safeMax));
  const [message, setMessage] = useState("");

  function updateQuantity(nextValue: number) {
    const nextQuantity = clampQuantity(nextValue, safeMax);
    setCurrentQuantity(nextQuantity);
    void saveQuantity(nextQuantity);
  }

  function saveQuantity(nextQuantity: number) {
    if (nextQuantity === savedQuantity || pending) {
      return;
    }

    setMessage("");
    startTransition(async () => {
      const formData = new FormData();
      formData.set("cartItemId", cartItemId);
      formData.set("quantity", String(nextQuantity));
      const nextState = await updateCartItemAction(emptyActionState, formData);
      if (nextState.ok) {
        setSavedQuantity(nextQuantity);
        router.refresh();
        return;
      }
      setCurrentQuantity(savedQuantity);
      setMessage(nextState.message ?? "数量更新失败");
    });
  }

  return (
    <form
      onSubmit={(event) => {
        event.preventDefault();
        void saveQuantity(currentQuantity);
      }}
      className="grid gap-2"
    >
      <input type="hidden" name="cartItemId" value={cartItemId} />
      <div className="flex items-center gap-2">
        <span className="inline-flex overflow-hidden rounded-md border border-line bg-white">
          <button
            aria-label="减少数量"
            className="grid h-9 w-9 place-items-center border-r border-line hover:bg-wash disabled:cursor-not-allowed disabled:opacity-45"
            disabled={pending || currentQuantity <= 1}
            onClick={() => updateQuantity(currentQuantity - 1)}
            type="button"
          >
            <Minus className="h-4 w-4" />
          </button>
          <input
            className="h-9 w-14 text-center outline-none"
            max={safeMax}
            min={1}
            name="quantity"
            onBlur={() => {
              void saveQuantity(currentQuantity);
            }}
            onChange={(event) => setCurrentQuantity(clampQuantity(Number(event.target.value), safeMax))}
            onKeyDown={(event) => {
              if (event.key === "Enter") {
                event.preventDefault();
                void saveQuantity(currentQuantity);
              }
            }}
            type="number"
            value={currentQuantity}
          />
          <button
            aria-label="增加数量"
            className="grid h-9 w-9 place-items-center border-l border-line hover:bg-wash disabled:cursor-not-allowed disabled:opacity-45"
            disabled={pending || currentQuantity >= safeMax}
            onClick={() => updateQuantity(currentQuantity + 1)}
            type="button"
          >
            <Plus className="h-4 w-4" />
          </button>
        </span>
        {pending ? <span className="text-xs text-muted">保存中</span> : null}
      </div>
      {message ? <span className="text-xs text-red-600">{message}</span> : null}
    </form>
  );
}

function clampQuantity(value: number, max: number) {
  if (!Number.isFinite(value)) {
    return 1;
  }
  return Math.min(Math.max(1, Math.trunc(value)), max);
}
