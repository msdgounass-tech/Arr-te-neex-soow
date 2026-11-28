import "server-only";
import Anthropic from "@anthropic-ai/sdk";
import { betaZodOutputFormat } from "@anthropic-ai/sdk/helpers/beta/zod";
import type { z } from "zod";

// Couche fournisseur de Shoppy AI. Toute la logique métier passe par `generate` : changer de fournisseur
// revient à écrire une autre implémentation de AiProvider. La clé reste côté serveur (variable d'environnement).

export type AiImage = { mediaType: "image/jpeg" | "image/png" | "image/webp"; data: string };
export interface AiRequest<T extends z.ZodType> {
  system: string;
  prompt: string;
  images?: AiImage[];
  schema: T;
  effort?: "low" | "medium" | "high";
  maxTokens?: number;
}
export interface AiResult<T> { data: T; model: string; inputTokens: number; outputTokens: number; costUsd: number }
export interface AiProvider { name: string; model: string; generate<T extends z.ZodType>(req: AiRequest<T>): Promise<AiResult<z.infer<T>>> }

export class AiError extends Error {
  constructor(public code: "IA_NON_CONFIGUREE" | "IA_REFUS" | "IA_INDISPONIBLE" | "IA_REPONSE_INVALIDE", message?: string) { super(message ?? code); }
}

// Tarifs publics (USD par million de jetons) pour estimer le coût de chaque génération.
const PRICES: Record<string, { input: number; output: number }> = {
  "claude-opus-5-5": { input: 4, output: 20 },
  "claude-sonnet-5-5": { input: 2, output: 10 },
  "claude-haiku-5-5": { input: 0.1, output: 0.5 },
};
export function estimateCost(model: string, inputTokens: number, outputTokens: number) {
  const p = PRICES[model] ?? PRICES["claude-opus-5-5"];
  return Math.round(((inputTokens * p.input + outputTokens * p.output) / 1_000_000) * 1e6) / 1e6;
}

export function aiConfigured() {
  return Boolean(process.env.ANTHROPIC_API_KEY);
}

class AnthropicProvider implements AiProvider {
  name = "anthropic";
  model = process.env.SHOPPY_AI_MODEL || "claude-opus-5-5";
  private client = new Anthropic({ maxRetries: 2, timeout: 60_000 });

  async generate<T extends z.ZodType>(req: AiRequest<T>): Promise<AiResult<z.infer<T>>> {
    const content: Anthropic.Beta.BetaContentBlockParam[] = [];
    for (const img of req.images ?? []) content.push({ type: "image", source: { type: "base64", media_type: img.mediaType, data: img.data } });
    content.push({ type: "text", text: req.prompt });
    let res;
    try {
      res = await this.client.beta.messages.parse({
        model: this.model,
        max_tokens: req.maxTokens ?? 4000,
        // Repli automatique sur un autre modèle si une demande est refusée par les filtres de sécurité.
        betas: ["server-side-fallback-2026-07-01"],
        fallbacks: "default",
        system: [{ type: "text", text: req.system, cache_control: { type: "ephemeral" } }],
        output_config: { effort: req.effort ?? "low", format: betaZodOutputFormat(req.schema) },
        messages: [{ role: "user", content }],
      });
    } catch (e) {
      if (e instanceof Anthropic.AuthenticationError || e instanceof Anthropic.PermissionDeniedError) throw new AiError("IA_NON_CONFIGUREE", e.message);
      if (e instanceof Anthropic.RateLimitError || e instanceof Anthropic.InternalServerError || e instanceof Anthropic.APIConnectionError) throw new AiError("IA_INDISPONIBLE", e.message);
      if (e instanceof Anthropic.APIError) throw new AiError("IA_INDISPONIBLE", `${e.status} ${e.message}`);
      throw e;
    }
    const inputTokens = (res.usage.input_tokens ?? 0) + (res.usage.cache_creation_input_tokens ?? 0) + (res.usage.cache_read_input_tokens ?? 0);
    const outputTokens = res.usage.output_tokens ?? 0;
    const model = res.model || this.model;
    if (res.stop_reason === "refusal") throw new AiError("IA_REFUS");
    if (res.parsed_output == null) throw new AiError("IA_REPONSE_INVALIDE");
    return { data: res.parsed_output as z.infer<T>, model, inputTokens, outputTokens, costUsd: estimateCost(model, inputTokens, outputTokens) };
  }
}

let provider: AiProvider | null = null;
export function getProvider(): AiProvider {
  if (!aiConfigured()) throw new AiError("IA_NON_CONFIGUREE");
  provider ??= new AnthropicProvider();
  return provider;
}
