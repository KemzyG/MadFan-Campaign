import { ContactShadows, Environment, Sky } from '@react-three/drei';
import { EffectComposer, Bloom, Vignette } from '@react-three/postprocessing';
import { BackSide } from 'three';
import { useCameraController } from '../../hooks/useCameraController';
import { useBallSimulation } from '../../hooks/useBallSimulation';
import { useSettingsStore } from '../../store/settingsStore';
import { CameraRig } from './CameraRig';
import { Crowd } from './Crowd';
import { Football } from './Football';
import { GoalNet } from './GoalNet';
import { GoalPost } from './GoalPost';
import { GoalZoneFace } from './GoalZoneFace';
import { Grass } from './Grass';
import { Lighting } from './Lighting';
import { MadFanBanner } from './MadFanBanner';
import { Stadium } from './Stadium';

function SimulationLoop() {
    useCameraController();
    useBallSimulation();

    return null;
}

/**
 * @module components/Scene/SceneRoot
 */
export function Scene() {
    const postprocessing = useSettingsStore((s) => s.postprocessing);
    const quality = useSettingsStore((s) => s.quality);
    const isLow = quality === 'low';
    const isHigh = quality === 'high';

    return (
        <>
            <SimulationLoop />
            <CameraRig />
            <Lighting quality={quality} />
            {!isLow ? (
                <Environment resolution={isHigh ? 256 : 64}>
                    <mesh scale={12}>
                        <sphereGeometry args={[1, 32, 32]} />
                        <meshBasicMaterial color="#152018" side={BackSide} />
                    </mesh>
                    <mesh position={[8, 10, 4]}>
                        <sphereGeometry args={[1.5, 16, 16]} />
                        <meshBasicMaterial color="#fff5d6" />
                    </mesh>
                    <mesh position={[-6, 8, -4]}>
                        <sphereGeometry args={[1.2, 16, 16]} />
                        <meshBasicMaterial color="#c8d8a0" />
                    </mesh>
                </Environment>
            ) : null}
            {!isLow ? <Sky sunPosition={[40, 8, -20]} turbidity={6} rayleigh={0.55} mieCoefficient={0.004} /> : null}
            <fog attach="fog" args={['#050a08', 28, 75]} />
            <color attach="background" args={['#050a08']} />
            <hemisphereLight args={['#9bb8ff', '#1a2218', isLow ? 0.65 : 0.45]} />
            <Grass />
            <Stadium />
            {!isLow ? <Crowd /> : null}
            <GoalPost />
            <GoalZoneFace />
            <GoalNet quality={quality} />
            <MadFanBanner />
            <Football />
            {isHigh ? <ContactShadows position={[0, 0.01, 0]} opacity={0.5} scale={40} blur={2.4} far={18} /> : null}
            {postprocessing && !isLow ? (
                <EffectComposer multisampling={0} enableNormalPass={false}>
                    <Bloom intensity={0.26} luminanceThreshold={0.82} mipmapBlur />
                    <Vignette offset={0.25} darkness={0.48} />
                </EffectComposer>
            ) : null}
        </>
    );
}
