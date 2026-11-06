// Installed from the unique R4 tar; do not re-author V3 placement or G04 history.
export const HOME_SCENE_HANDOFF = {
  "schemaVersion": 1,
  "format": "gulu-scene-handoff",
  "exportedAt": "2026-11-02T14:31:43.095Z",
  "status": "approved",
  "installed": false,
  "published": false,
  "scene": {
    "id": "cozy-room",
    "width": 390,
    "height": 440,
    "time": "day"
  },
  "layout": {
    "id": "77350f81-9dae-4d18-af09-706c7fe73446",
    "name": "小屋配置 V3－核准素材對應候補",
    "path": "v3-config.json",
    "sha256": "614c6f0f590bd42d62904799a116d6172727d189b6e271b891fd58432c447a2b"
  },
  "manifest": {
    "path": "manifest.json"
  },
  "placementAuthority": "handoff.objects.displayRect/renderLayer and v3-config.json; manifest sceneImage displayRect/renderLayer are legacy S3 reference defaults, not installation placement",
  "objects": [
    {
      "id": "background.day",
      "assetId": "gulu.scene.background-day.art-v3",
      "sceneObjectId": "cozy-room.background",
      "binding": "image.room.cozy-room.background",
      "candidateId": "b89adc94-3de8-408e-bed4-c37972ebf3a0",
      "candidateVersion": "art-v3",
      "imagePath": "assets/gulu.scene.background-day.art-v3/0001.png",
      "sha256": "af32e2cc88c74dfc01bb6ceeb4e5df08c40188eff95a6b10be6c499656724fbf",
      "canvas": {
        "width": 1185,
        "height": 1337
      },
      "transparency": "opaque",
      "displayRect": {
        "x": 0,
        "y": 0,
        "width": 390,
        "height": 440
      },
      "scale": 1,
      "visualAnchor": {
        "x": 0,
        "y": 0
      },
      "renderLayer": 0,
      "approval": {
        "by": "SH",
        "at": "2026-11-02T13:06:25.946Z"
      },
      "source": {
        "path": "/assets/art-derived/home/s3-a03b-1-v1/background.day.png",
        "parentCandidateId": "68417588-5d4a-4b7a-add3-de0958541aed",
        "parentVersion": "art-v2",
        "parentPath": "/assets/imports/room/background.day.png",
        "parentSha256": "1c57ef3fce4afdaa0f1a628f4f8947afa95a510108c06071aeb4f39a992d1b80"
      },
      "g05Manifest": "g05/background.day.json"
    },
    {
      "id": "window",
      "assetId": "gulu.furniture.window.art-v4",
      "sceneObjectId": "window",
      "binding": "image.item.cozy-room.window",
      "candidateId": "5d10cd50-a5a9-4f11-8ee9-ee5469f0077d",
      "candidateVersion": "art-v4",
      "imagePath": "assets/gulu.furniture.window.art-v4/0001.png",
      "sha256": "3fe8213ef6bbcb6eafbcfc5a81437a655b13b7e865ef3e15e90483f61413795d",
      "canvas": {
        "width": 1182,
        "height": 1342
      },
      "transparency": "transparent",
      "displayRect": {
        "x": 17.756758569299556,
        "y": 17.556669150521614,
        "width": 163.59,
        "height": 185.73
      },
      "scale": 1.23,
      "visualAnchor": {
        "x": 0,
        "y": 0
      },
      "renderLayer": 10,
      "approval": {
        "by": "SH",
        "at": "2026-11-02T13:07:53.344Z"
      },
      "source": {
        "path": "/assets/art-derived/home/s3-a03b-1-v1/window.png",
        "parentCandidateId": "fa3e726e-a5f5-4491-b6b4-2d46123fa8f3",
        "parentVersion": "art-v2",
        "parentPath": "/assets/imports/room/window.png",
        "parentSha256": "324a812029e5624dcc25e617eea1487b1557cab66b13d583f5f32696cd2d403b"
      },
      "g05Manifest": "g05/window.json"
    },
    {
      "id": "sofa",
      "assetId": "gulu.furniture.sofa.art-v3",
      "sceneObjectId": "sofa",
      "binding": "image.item.cozy-room.sofa",
      "candidateId": "98e988c0-6cfa-47cc-bcc0-4b41fa2d5a3f",
      "candidateVersion": "art-v3",
      "imagePath": "assets/gulu.furniture.sofa.art-v3/0001.png",
      "sha256": "d99af0b1aa2501f0eb7c31e4aaf4c7b72179f41f0acca9bd2636fe908d5259bb",
      "canvas": {
        "width": 1166,
        "height": 1350
      },
      "transparency": "transparent",
      "displayRect": {
        "x": 176.90260310239393,
        "y": 129.53963159072265,
        "width": 209.00000000000003,
        "height": 242.00000000000003
      },
      "scale": 2.2,
      "visualAnchor": {
        "x": 0,
        "y": 0
      },
      "renderLayer": 30,
      "approval": {
        "by": "SH",
        "at": "2026-11-02T13:08:10.636Z"
      },
      "source": {
        "path": "/assets/art-derived/home/s3-a03b-1-v1/sofa.png",
        "parentCandidateId": "247a60b2-035c-43fa-8e49-8c391f9e35d2",
        "parentVersion": "art-v1",
        "parentPath": "/assets/imports/room/sofa.png",
        "parentSha256": "ce3920ada34474aef42dfb83a452d4bda59c31fbf55c35dea187dfecbb865bae"
      },
      "g05Manifest": "g05/sofa.json"
    },
    {
      "id": "cat-bed",
      "assetId": "gulu.furniture.cat-bed.art-v3",
      "sceneObjectId": "cat-bed",
      "binding": "image.item.cozy-room.cat-bed",
      "candidateId": "6c53522a-bda8-4202-b251-98f2c2806238",
      "candidateVersion": "art-v3",
      "imagePath": "assets/gulu.furniture.cat-bed.art-v3/0001.png",
      "sha256": "aec21cb63f4cb80a953ae1df343993e9b72137cd4c64db13916718e06efa2f4f",
      "canvas": {
        "width": 1573,
        "height": 1001
      },
      "transparency": "transparent",
      "displayRect": {
        "x": -4.311188811188819,
        "y": 287.2132867132868,
        "width": 148.5,
        "height": 94.5
      },
      "scale": 1.35,
      "visualAnchor": {
        "x": 0,
        "y": 0
      },
      "renderLayer": 30,
      "approval": {
        "by": "SH",
        "at": "2026-11-02T13:08:34.509Z"
      },
      "source": {
        "path": "/assets/art-derived/home/s3-a03b-1-v1/cat-bed.png",
        "parentCandidateId": "0e3a2942-94d6-435d-89ef-82db5da7011b",
        "parentVersion": "art-v1",
        "parentPath": "/assets/imports/room/cat-bed.png",
        "parentSha256": "d718cf0f9d1a4ac94e38adbf3749d45c2ce89a25634450fb4569ad9d860d1644"
      },
      "g05Manifest": "g05/cat-bed.json"
    },
    {
      "id": "rug",
      "assetId": "gulu.furniture.rug.art-v3",
      "sceneObjectId": "rug",
      "binding": "image.item.cozy-room.rug",
      "candidateId": "d806982b-4156-46ac-bd7b-8c9dd71707cd",
      "candidateVersion": "art-v3",
      "imagePath": "assets/gulu.furniture.rug.art-v3/0001.png",
      "sha256": "6d4b7b27ee8aa9711a462fe8ceecb62db01cb9f3a64f8c2e08d7856919a7154e",
      "canvas": {
        "width": 2034,
        "height": 780
      },
      "transparency": "transparent",
      "displayRect": {
        "x": 110.30434782608688,
        "y": 348.56173913043466,
        "width": 206,
        "height": 79
      },
      "scale": 1,
      "visualAnchor": {
        "x": 0,
        "y": 0
      },
      "renderLayer": 20,
      "approval": {
        "by": "SH",
        "at": "2026-11-02T13:08:58.650Z"
      },
      "source": {
        "path": "/assets/art-derived/home/s3-a03b-1-v1/rug.png",
        "parentCandidateId": "032c4581-e1a6-46d6-926c-5bf47a1fdd16",
        "parentVersion": "art-v1",
        "parentPath": "/assets/imports/room/rug.png",
        "parentSha256": "b8f981e622b781a17622447ce2846f7673a98ca0577d7b17d15e33cca11414d0"
      },
      "g05Manifest": "g05/rug.json"
    },
    {
      "id": "plant",
      "assetId": "gulu.furniture.plant.art-v3",
      "sceneObjectId": "plant",
      "binding": "image.item.cozy-room.plant",
      "candidateId": "1d6dd603-6fff-482c-a637-bbd34d106690",
      "candidateVersion": "art-v3",
      "imagePath": "assets/gulu.furniture.plant.art-v3/0001.png",
      "sha256": "eb420932f600eebe8ed491bac8f99329bd88f5b463a91d3edbb6ea5b36816c87",
      "canvas": {
        "width": 1079,
        "height": 1461
      },
      "transparency": "transparent",
      "displayRect": {
        "x": 300.4191304347826,
        "y": 322.55386227182987,
        "width": 78.72,
        "height": 106.6
      },
      "scale": 1.64,
      "visualAnchor": {
        "x": 0,
        "y": 0
      },
      "renderLayer": 35,
      "approval": {
        "by": "SH",
        "at": "2026-11-02T13:09:17.585Z"
      },
      "source": {
        "path": "/assets/art-derived/home/s3-a03b-1-v1/plant.png",
        "parentCandidateId": "7856b958-9e4a-4ad9-a455-55d5961c2472",
        "parentVersion": "art-v1",
        "parentPath": "/assets/imports/room/plant.png",
        "parentSha256": "e7b1454cee33457c7f3c19c2eca4198e94fecd75699466713e0c0e96af050bc3"
      },
      "g05Manifest": "g05/plant.json"
    },
    {
      "id": "shelf",
      "assetId": "gulu.furniture.shelf.art-v3",
      "sceneObjectId": "shelf",
      "binding": "image.item.cozy-room.shelf",
      "candidateId": "9c8ee9ff-5a2a-4240-b70b-08628d92819d",
      "candidateVersion": "art-v3",
      "imagePath": "assets/gulu.furniture.shelf.art-v3/0001.png",
      "sha256": "a728cd09bcec669d5c1eea1ed0f99f93981ac2ce42abf9d675c153d3e2f5b15b",
      "canvas": {
        "width": 1628,
        "height": 983
      },
      "transparency": "transparent",
      "displayRect": {
        "x": 194.85203856871163,
        "y": 42.86260869565217,
        "width": 163.24,
        "height": 98.56
      },
      "scale": 1.54,
      "visualAnchor": {
        "x": 0,
        "y": 0
      },
      "renderLayer": 10,
      "approval": {
        "by": "SH",
        "at": "2026-11-02T13:09:45.402Z"
      },
      "source": {
        "path": "/assets/art-derived/home/s3-a03b-1-v1/shelf.png",
        "parentCandidateId": "bdb5f101-795d-4676-813d-d17a851e1f6b",
        "parentVersion": "art-v1",
        "parentPath": "/assets/imports/room/shelf.png",
        "parentSha256": "b18843b35deecb25128067b166ce7e8354bba53c9591b876dc6a8bd35d7218ad"
      },
      "g05Manifest": "g05/shelf.json"
    }
  ],
  "physics": {
    "source": "v3-config.json#/rules",
    "collisions": {
      "sofa": [
        {
          "x": 179.59128234767695,
          "y": 270,
          "width": 203.0849056603774,
          "height": 10
        },
        {
          "x": 180.66675404579016,
          "y": 280,
          "width": 202.90566037735852,
          "height": 10
        },
        {
          "x": 182.45920687597882,
          "y": 290,
          "width": 201.8301886792453,
          "height": 10
        },
        {
          "x": 184.4309049891864,
          "y": 300,
          "width": 200.03773584905662,
          "height": 10
        },
        {
          "x": 188.37430121560146,
          "y": 310,
          "width": 195.7358490566038,
          "height": 10
        },
        {
          "x": 194.64788612126185,
          "y": 320,
          "width": 181.57547169811323,
          "height": 10
        },
        {
          "x": 310.44033895145054,
          "y": 330,
          "width": 49.113207547169814,
          "height": 10
        },
        {
          "x": 328.36486725333737,
          "y": 340,
          "width": 14.339622641509436,
          "height": 4.105669326571729
        }
      ],
      "cat-bed": [
        {
          "x": 37.88811188811188,
          "y": 294.48251748251755,
          "width": 64.47902097902097,
          "height": 5.517482517482449
        },
        {
          "x": 18.34615384615384,
          "y": 300,
          "width": 103.46853146853147,
          "height": 10
        },
        {
          "x": 8.622377622377615,
          "y": 310,
          "width": 123.2937062937063,
          "height": 10
        },
        {
          "x": 3.0524475524475445,
          "y": 320,
          "width": 133.86713286713285,
          "height": 10
        },
        {
          "x": 2.013986013986006,
          "y": 330,
          "width": 136.32167832167832,
          "height": 10
        },
        {
          "x": 2.2027972027971945,
          "y": 340,
          "width": 135.56643356643355,
          "height": 10
        },
        {
          "x": 3.9020979020978945,
          "y": 350,
          "width": 131.506993006993,
          "height": 10
        },
        {
          "x": 9.472027972027965,
          "y": 360,
          "width": 120.65034965034964,
          "height": 10
        },
        {
          "x": 26.937062937062926,
          "y": 370,
          "width": 82.5104895104895,
          "height": 5.104895104895149
        }
      ],
      "plant": {
        "x": 340,
        "y": 408,
        "width": 25,
        "height": 15
      }
    },
    "approaches": {
      "sofa": {
        "x": 231.9,
        "y": 360.54
      },
      "cat-bed": {
        "x": 110.44,
        "y": 384
      },
      "rug": {
        "x": 213.3,
        "y": 398.56
      }
    },
    "world": {
      "floor": {
        "x": 12,
        "y": 270,
        "width": 366,
        "height": 158
      },
      "visualBounds": {
        "x": 80,
        "y": 278,
        "width": 230,
        "height": 142
      },
      "radius": 8,
      "speed": 7
    },
    "renderLayers": {
      "plant": 35
    },
    "confirmation": {
      "basis": "User instruction S3-A03B-5: accepts B4 collision and plant A for candidate configuration only",
      "at": "2026-10-31T02:30:33.570Z",
      "scope": "candidate-physics-and-layer-only"
    }
  },
  "provenance": {
    "path": "provenance/99865a4386f0011b985f1bb1678b1cd9d7021822b62a40fe1cbd7bb63373aee7.json",
    "sha256": "99865a4386f0011b985f1bb1678b1cd9d7021822b62a40fe1cbd7bb63373aee7",
    "scope": "technical-provenance-only",
    "sourceCollision": {
      "path": "evidence/b4-collision-source.json",
      "sha256": "1aba341078224144fbd4e3b7c5ebcbdc77f66a59a7459904bcd1dbf7a303afd2"
    },
    "sceneImageHistory": "evidence/scene-image-history.json",
    "layoutHistory": "evidence/layout-history.json"
  },
  "installation": {
    "automatic": false,
    "requiresExplicitInstallAndPublish": true,
    "targetRoot": "public/assets/game/",
    "preserveExistingAnimations": true,
    "doNotUseManifestReferenceDefaultPlacement": true
  },
  "referencePolicy": "All runtime PNG, handoff and evidence-file references are package relative. Original /assets paths inside immutable V3/G04/provenance snapshots are historical project references, verified at export; originals are retained in the project, not installed from this bundle."
} as const
