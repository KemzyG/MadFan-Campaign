import * as THREE from 'three';
import { KEEPER_MATERIAL_PROFILES, KEEPER_MODEL } from '../../../constants/goalkeeperAppearance';

/**
 * @module components/Scene/GoalKeeper/enhanceMaterials
 */

function resolveProfile(name) {
    const n = name || '';
    for (const [key, profile] of Object.entries(KEEPER_MATERIAL_PROFILES)) {
        if (key === 'default') {
            continue;
        }
        if (profile.match?.some((re) => re.test(n))) {
            return profile;
        }
    }

    return KEEPER_MATERIAL_PROFILES.default;
}

/**
 * @param {THREE.Object3D} root
 */
export function enhanceKeeperMaterials(root) {
    root.traverse((obj) => {
        if (!obj.isMesh) {
            return;
        }

        obj.castShadow = KEEPER_MODEL.castShadow;
        obj.receiveShadow = KEEPER_MODEL.receiveShadow;
        obj.frustumCulled = true;
        obj.visible = true;

        const mats = Array.isArray(obj.material) ? obj.material : [obj.material];
        mats.forEach((mat) => {
            if (!mat) {
                return;
            }
            const profile = resolveProfile(mat.name || obj.name);
            if ('roughness' in mat && profile.roughness != null) {
                mat.roughness = profile.roughness;
            }
            if ('metalness' in mat && profile.metalness != null) {
                mat.metalness = profile.metalness;
            }
            if ('envMapIntensity' in mat) {
                mat.envMapIntensity = profile.envMapIntensity ?? KEEPER_MODEL.envMapIntensity;
            }
            // Ensure materials aren't stuck invisible
            if ('opacity' in mat && mat.opacity < 0.05) {
                mat.opacity = 1;
                mat.transparent = false;
            }
            mat.side = THREE.FrontSide;
            mat.depthWrite = true;
            mat.needsUpdate = true;
        });
    });
}

/**
 * @param {THREE.Object3D} root
 * @param {number} targetHeight
 */
export function fitKeeperHeight(root, targetHeight) {
    root.updateMatrixWorld(true);
    const box = new THREE.Box3().setFromObject(root);
    const size = new THREE.Vector3();
    box.getSize(size);

    let native = size.y;
    if (!Number.isFinite(native) || native < 0.2) {
        native = KEEPER_MODEL.assetNativeHeight;
    }

    const scale = targetHeight / native;
    if (!Number.isFinite(scale) || scale <= 0 || scale > 20) {
        root.scale.setScalar(1);

        return 1;
    }

    root.scale.setScalar(scale);
    root.updateMatrixWorld(true);

    const grounded = new THREE.Box3().setFromObject(root);
    if (Number.isFinite(grounded.min.y)) {
        root.position.y -= grounded.min.y;
    }

    return scale;
}
