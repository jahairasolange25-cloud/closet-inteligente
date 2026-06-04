"""Generate a 3D body mesh from pose data and skin colour.

Primary path: SMPL-X parametric model (T-pose, height-scaled betas).
Fallback:     Geometric A-pose body built from trimesh primitives.
"""

from __future__ import annotations

import os
from pathlib import Path
from typing import TYPE_CHECKING

import numpy as np
import structlog

if TYPE_CHECKING:
    import trimesh as _trimesh

logger = structlog.get_logger(__name__)

_SMPLX_MODEL_DIR = Path(os.environ.get("SMPLX_MODEL_DIR", "/app/models/smplx"))
_SMPLX_MODEL_FILE = _SMPLX_MODEL_DIR / "SMPLX_NEUTRAL.npz"


# ---------------------------------------------------------------------------
# Internal helpers
# ---------------------------------------------------------------------------

def _oriented_capsule(radius: float, height: float, direction: np.ndarray) -> "_trimesh.Trimesh":
    """Create a trimesh capsule oriented along *direction* (unit vector)."""
    import trimesh  # noqa: PLC0415

    mesh = trimesh.creation.capsule(radius=radius, height=height)
    z = np.array([0.0, 0.0, 1.0])
    d = np.asarray(direction, dtype=float)
    d = d / np.linalg.norm(d)

    if np.allclose(d, z):
        return mesh
    if np.allclose(d, -z):
        R = trimesh.transformations.rotation_matrix(np.pi, [1.0, 0.0, 0.0])
        mesh.apply_transform(R)
        return mesh

    axis = np.cross(z, d)
    axis /= np.linalg.norm(axis)
    angle = float(np.arccos(np.clip(np.dot(z, d), -1.0, 1.0)))
    R = trimesh.transformations.rotation_matrix(angle, axis)
    mesh.apply_transform(R)
    return mesh


def _with_color(mesh: "_trimesh.Trimesh", rgba: np.ndarray) -> "_trimesh.Trimesh":
    """Return a new Trimesh with per-vertex colour set."""
    import trimesh  # noqa: PLC0415

    n = len(mesh.vertices)
    return trimesh.Trimesh(
        vertices=mesh.vertices.copy(),
        faces=mesh.faces.copy(),
        vertex_colors=np.tile(rgba, (n, 1)),
        process=False,
    )


def _merge_parts(parts: "list[_trimesh.Trimesh]") -> "_trimesh.Trimesh":
    """Manually merge meshes, preserving per-vertex colours."""
    import trimesh  # noqa: PLC0415

    all_verts: list[np.ndarray] = []
    all_faces: list[np.ndarray] = []
    all_colors: list[np.ndarray] = []
    offset = 0

    for m in parts:
        all_verts.append(m.vertices)
        all_faces.append(m.faces + offset)
        # Ensure vertex_colors is 2-D (N, 4)
        vc = np.asarray(m.visual.vertex_colors)
        if vc.ndim == 1:
            vc = np.tile(vc, (len(m.vertices), 1))
        all_colors.append(vc)
        offset += len(m.vertices)

    return trimesh.Trimesh(
        vertices=np.vstack(all_verts),
        faces=np.vstack(all_faces),
        vertex_colors=np.vstack(all_colors),
        process=False,
    )


# ---------------------------------------------------------------------------
# Geometric fallback body (A-pose)
# ---------------------------------------------------------------------------

def _make_geometric_body(
    skin_color: tuple[int, int, int],
    height_cm: float,
) -> "_trimesh.Trimesh":
    """Build a human-like body from capsules/spheres/boxes.

    Proportions follow the classic 8-heads rule.
    Arms are placed in A-pose (~45° from vertical).
    Y is up; feet rest on y=0.
    """
    import trimesh  # noqa: PLC0415

    H = height_cm / 100.0
    rgba = np.array([*skin_color, 255], dtype=np.uint8)

    up = np.array([0.0, 1.0, 0.0])
    arm_l = np.array([-0.707, -0.707, 0.0])
    arm_r = np.array([0.707, -0.707, 0.0])

    parts: list["_trimesh.Trimesh"] = []

    def _add(mesh: "_trimesh.Trimesh", tx: float = 0.0, ty: float = 0.0, tz: float = 0.0) -> None:
        mesh.apply_translation([tx, ty, tz])
        parts.append(_with_color(mesh, rgba))

    # Head
    _add(trimesh.creation.icosphere(radius=H * 0.065, subdivisions=3), ty=H * 0.9375)

    # Neck
    _add(_oriented_capsule(H * 0.023, H * 0.03, up), ty=H * 0.785)

    # Torso (chest + upper abdomen as one box)
    _add(trimesh.creation.box(extents=[H * 0.24, H * 0.25, H * 0.13]), ty=H * 0.625)

    # Pelvis
    _add(trimesh.creation.box(extents=[H * 0.20, H * 0.13, H * 0.13]), ty=H * 0.490)

    # Left thigh (hip→knee)
    _add(_oriented_capsule(H * 0.054, H * 0.23, up), tx=-(H * 0.085), ty=H * 0.375)

    # Left calf (knee→ankle)
    _add(_oriented_capsule(H * 0.038, H * 0.20, up), tx=-(H * 0.085), ty=H * 0.145)

    # Left foot
    _add(
        trimesh.creation.box(extents=[H * 0.06, H * 0.04, H * 0.14]),
        tx=-(H * 0.085), ty=H * 0.02, tz=H * 0.04,
    )

    # Right thigh
    _add(_oriented_capsule(H * 0.054, H * 0.23, up), tx=(H * 0.085), ty=H * 0.375)

    # Right calf
    _add(_oriented_capsule(H * 0.038, H * 0.20, up), tx=(H * 0.085), ty=H * 0.145)

    # Right foot
    _add(
        trimesh.creation.box(extents=[H * 0.06, H * 0.04, H * 0.14]),
        tx=(H * 0.085), ty=H * 0.02, tz=H * 0.04,
    )

    # Left upper arm — placed at midpoint of shoulder→elbow
    # Shoulder: [-0.125, 0.750], dir A-pose = [-0.707,-0.707]
    # Center upper arm: [-0.183, 0.692] * H
    ua_l = _oriented_capsule(H * 0.028, H * 0.160, arm_l)
    ua_l.apply_translation([-(H * 0.183), H * 0.692, 0.0])
    parts.append(_with_color(ua_l, rgba))

    # Left forearm — center: [-0.293, 0.582] * H
    fa_l = _oriented_capsule(H * 0.022, H * 0.140, arm_l)
    fa_l.apply_translation([-(H * 0.293), H * 0.582, 0.0])
    parts.append(_with_color(fa_l, rgba))

    # Left hand
    _add(
        trimesh.creation.box(extents=[H * 0.045, H * 0.075, H * 0.025]),
        tx=-(H * 0.368), ty=H * 0.492,
    )

    # Right upper arm
    ua_r = _oriented_capsule(H * 0.028, H * 0.160, arm_r)
    ua_r.apply_translation([(H * 0.183), H * 0.692, 0.0])
    parts.append(_with_color(ua_r, rgba))

    # Right forearm
    fa_r = _oriented_capsule(H * 0.022, H * 0.140, arm_r)
    fa_r.apply_translation([(H * 0.293), H * 0.582, 0.0])
    parts.append(_with_color(fa_r, rgba))

    # Right hand
    _add(
        trimesh.creation.box(extents=[H * 0.045, H * 0.075, H * 0.025]),
        tx=(H * 0.368), ty=H * 0.492,
    )

    return _merge_parts(parts)


# ---------------------------------------------------------------------------
# SMPL-X path
# ---------------------------------------------------------------------------

def _make_smplx_body(
    skin_color: tuple[int, int, int],
    height_cm: float,
) -> "_trimesh.Trimesh":
    """Generate a SMPL-X T-pose mesh with height-scaled betas."""
    import torch  # noqa: PLC0415
    import smplx  # noqa: PLC0415
    import trimesh  # noqa: PLC0415

    if not _SMPLX_MODEL_FILE.exists():
        raise FileNotFoundError(f"SMPL-X model not found at {_SMPLX_MODEL_FILE}")

    model = smplx.create(
        str(_SMPLX_MODEL_DIR),
        model_type="smplx",
        gender="neutral",
        num_betas=10,
        use_pca=False,
        flat_hand_mean=True,
        batch_size=1,
    )

    # Beta[0] ≈ +1 per extra 5 cm above 170 cm baseline
    height_beta = (height_cm - 170.0) / 5.0
    betas = torch.zeros(1, 10, dtype=torch.float32)
    betas[0, 0] = float(height_beta)

    with torch.no_grad():
        output = model(betas=betas, return_verts=True)

    vertices = output.vertices.detach().numpy()[0]  # (N, 3)
    faces = model.faces  # (F, 3)

    r, g, b = skin_color
    n = len(vertices)
    rgba = np.array([r, g, b, 255], dtype=np.uint8)

    mesh = trimesh.Trimesh(
        vertices=vertices,
        faces=faces,
        vertex_colors=np.tile(rgba, (n, 1)),
        process=False,
    )
    logger.info("smplx_mesh_generated", vertices=n, faces=len(faces), height_cm=height_cm)
    return mesh


# ---------------------------------------------------------------------------
# Public API
# ---------------------------------------------------------------------------

def smplx_available() -> bool:
    return _SMPLX_MODEL_FILE.exists()


def generate_body_mesh(
    pose_data: dict,
    skin_color: tuple[int, int, int],
    height_cm: float = 170.0,
) -> "_trimesh.Trimesh":
    """Return a trimesh.Trimesh coloured with *skin_color*.

    Tries SMPL-X first; falls back to geometric primitives if the model
    file is absent or if any error occurs.
    """
    if smplx_available():
        try:
            return _make_smplx_body(skin_color, height_cm)
        except Exception as exc:
            logger.warning("smplx_failed_using_geometric_fallback", error=str(exc))

    logger.info("body_mesh_geometric_fallback", height_cm=height_cm)
    return _make_geometric_body(skin_color, height_cm)
