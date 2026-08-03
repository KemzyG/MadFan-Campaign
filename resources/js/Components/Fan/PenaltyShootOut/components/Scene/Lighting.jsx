import { memo } from 'react';

/**
 * @module components/Scene/Lighting
 * Only the high tier casts real-time shadows — multiple shadow maps crush mobile GPUs.
 */
export const Lighting = memo(function Lighting({ quality = 'medium' }) {
    const shadows = quality === 'high';

    return (
        <>
            <ambientLight intensity={quality === 'low' ? 0.55 : 0.35} />
            <directionalLight
                castShadow={shadows}
                position={[12, 18, 8]}
                intensity={quality === 'low' ? 1.1 : 1.35}
                shadow-mapSize-width={1024}
                shadow-mapSize-height={1024}
                shadow-camera-far={60}
                shadow-camera-left={-20}
                shadow-camera-right={20}
                shadow-camera-top={20}
                shadow-camera-bottom={-20}
            />
            <spotLight position={[-10, 14, -8]} angle={0.45} penumbra={0.5} intensity={1.05} color="#e8ff00" />
            <spotLight position={[10, 14, -8]} angle={0.45} penumbra={0.5} intensity={1.05} color="#ffc400" />
            <pointLight position={[0, 10, -16]} intensity={0.75} color="#ffffff" />
        </>
    );
});
