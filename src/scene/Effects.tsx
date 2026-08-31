import { EffectComposer, Bloom, Vignette } from '@react-three/postprocessing'

/**
 * The full-tier pass, in its own module so it can be fetched separately.
 *
 * `postprocessing` and its react bindings are a large dependency, and the lite
 * tier never renders any of it — which is most phones. Kept inline in App it
 * was downloaded by every visitor and used by some, so it lives here and is
 * imported lazily.
 *
 * Restrained on purpose: the bloom exists to make the amber core and the
 * travelling packets read as emissive, not to wash the scene.
 */
export function Effects() {
  return (
    <EffectComposer>
      <Bloom intensity={0.72} luminanceThreshold={0.34} luminanceSmoothing={0.3} mipmapBlur />
      <Vignette offset={0.28} darkness={0.62} eskil={false} />
    </EffectComposer>
  )
}
