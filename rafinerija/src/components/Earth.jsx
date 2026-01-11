import React, { useRef, useMemo } from 'react'
import { useFrame } from '@react-three/fiber'
import { useGLTF } from '@react-three/drei'

export default function Model(props) {
    const ref = useRef()  // Ref za manipulaciju objektom

    // Koristimo useMemo da sprečimo ponovna učitavanja modela
    const { nodes, materials } = useMemo(() => useGLTF('/earth.gltf'), [])

    // Glatka rotacija modela bez dodatnog renderovanja
    useFrame(() => {
        if (ref.current) {
            ref.current.rotation.y += 0.0
        }
    })

    return (
        <group {...props} dispose={null}>
            <mesh
                ref={ref}
                geometry={nodes.Object_4.geometry}
                material={materials['Scene_-_Root']}
                scale={0.5}
                castShadow
                receiveShadow
            />
        </group>
    )
}


useGLTF.preload('/earth.gltf')
