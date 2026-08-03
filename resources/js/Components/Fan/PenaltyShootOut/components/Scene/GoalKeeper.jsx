import { Suspense, lazy, memo, Component, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { KEEPER_MODEL } from '../../constants/goalkeeperAppearance';
import { useGoalkeeperStore } from '../../store/goalkeeperStore';
import { poseFromState } from '../../systems/goalkeeper/GoalkeeperAnimation';

/**
 * @module components/Scene/GoalKeeper
 * GLB-only goalkeeper entry.
 */

const AssetKeeper = lazy(() => import('./GoalKeeper/AssetKeeper'));

function AssetMissingPlaceholder() {
    const root = useRef(null);

    useFrame(() => {
        const keeper = useGoalkeeperStore.getState();
        if (!root.current) {
            return;
        }
        const pose = poseFromState(keeper.animState, keeper.position);
        root.current.position.set(keeper.position.x, keeper.position.y + 0.95, keeper.position.z);
        root.current.rotation.y = pose.yaw;
        root.current.rotation.z = pose.lean * 0.3;
    });

    return (
        <group ref={root}>
            <mesh>
                <boxGeometry args={[0.55, 1.9, 0.35]} />
                <meshBasicMaterial color="#e8ff00" wireframe transparent opacity={0.55} />
            </mesh>
        </group>
    );
}

class KeeperErrorBoundary extends Component {
    constructor(props) {
        super(props);
        this.state = { hasError: false };
    }

    static getDerivedStateFromError() {
        return { hasError: true };
    }

    componentDidCatch(error) {
        console.error('[GoalKeeper] failed to load GLB:', error);
    }

    render() {
        if (this.state.hasError) {
            return <AssetMissingPlaceholder />;
        }

        return this.props.children;
    }
}

export const GoalKeeper = memo(function GoalKeeper() {
    return (
        <KeeperErrorBoundary>
            <Suspense fallback={<AssetMissingPlaceholder />}>
                <AssetKeeper url={KEEPER_MODEL.url} />
            </Suspense>
        </KeeperErrorBoundary>
    );
});
