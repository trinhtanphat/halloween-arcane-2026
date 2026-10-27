/**
 * Ravenhollow: original procedurally generated secret treasury chamber.
 * Opens after the canonical four-relic vault is unlocked. No network assets.
 * World-space ground plane x/z ±4, visitor's eye height 1.64.
 */
export function createVaultChamber(THREE) {
  const group=new THREE.Group();
  group.name="ravenhollow-secret-vault";
  const colliders=[];
  const solid=(color,metalness=.2,roughness=.7)=>new THREE.MeshStandardMaterial({color,metalness,roughness});
  const stone=solid(0x39334c),darkStone=solid(0x292337),gold=solid(0xd8ac63,.64,.3);
  const luminous=new THREE.MeshStandardMaterial({color:0xf0d797,emissive:0xeca66f,emissiveIntensity:.65,metalness:.25,roughness:.35});
  function addBox(x,y,z,w,h,d,material=stone,block=false) {
    const mesh=new THREE.Mesh(new THREE.BoxGeometry(w,h,d),material);
    mesh.position.set(x,y,z);group.add(mesh);
    if(block)colliders.push({minX:x-w/2,maxX:x+w/2,minZ:z-d/2,maxZ:z+d/2});
    return mesh;
  }
  // Separate vaulted throne room, lit by magical amber and violet torches.
  addBox(0,-.25,0,9,.5,9,darkStone);
  addBox(0,5.65,0,9,.42,9,stone);
  for(const x of [-4.5,4.5])addBox(x,2.8,0,.35,5.6,9,stone);
  for(const z of [-4.5,4.5])addBox(0,2.8,z,9,5.6,.35,stone);
  // Inlaid ceremonial floor.
  for(let i=-3;i<=3;i++){
    addBox(i*1.15,.017,0,.024,.032,8.5,gold);
    addBox(0,.021,i*1.15,8.5,.028,.024,gold);
  }
  const circle=new THREE.Mesh(new THREE.RingGeometry(1.65,1.77,48),new THREE.MeshBasicMaterial({color:0xc7aa72,side:THREE.DoubleSide}));
  circle.rotation.x=-Math.PI/2;circle.position.y=.035;group.add(circle);
  // Stone pillars and gothic arches.
  for(const x of [-3.55,3.55]){
    for(const z of [-3.15,0,3.15]){
      addBox(x,2.55,z,.56,5.05,.56,stone,true);
      addBox(x,4.95,z,.86,.26,.86,gold);
      addBox(x,.22,z,.87,.44,.87,stone);
    }
    for(const z of [-1.58,1.58]){
      const flame=new THREE.Mesh(new THREE.ConeGeometry(.16,.58,8),new THREE.MeshBasicMaterial({color:0xe5a4fd}));
      flame.position.set(x,2.55,z);group.add(flame);
      const light=new THREE.PointLight(0xa578ff,5.5,6);light.position.set(x,2.65,z);group.add(light);
    }
  }
  const lantern=new THREE.PointLight(0xf5c48b,36,13);
  lantern.position.set(0,4.3,-2.7);group.add(lantern);
  group.add(new THREE.HemisphereLight(0xdcc4ff,0x241934,1.6));
  // Four relic shrines along the side walls.
  const icons=[0xffc57f,0xb99aff,0xa9d8ff,0x91d6a4];
  let index=0;
  for(const x of [-2.15,2.15])for(const z of [-2,1.35]){
    const pedestal=addBox(x,.56,z,.7,1.12,.7,stone,true);
    const crystal=new THREE.Mesh(new THREE.OctahedronGeometry(.26,0),
      new THREE.MeshStandardMaterial({color:icons[index],emissive:icons[index],emissiveIntensity:1.4}));
    crystal.position.set(x,1.52,z);group.add(crystal);
    const halo=new THREE.Mesh(new THREE.TorusGeometry(.43,.034,6,26),new THREE.MeshBasicMaterial({color:icons[index]}));
    halo.position.set(x,1.52,z);group.add(halo);
    index++;
  }
  // Central stairs, throne and isolated crown upon the rear dais.
  const steps=[{w:2.8,z:-2.25,h:.15},{w:2.45,z:-2.72,h:.34},{w:2.1,z:-3.17,h:.53}];
  for(const step of steps)addBox(0,step.h/2,step.z,step.w,step.h,.55,solid(0x655875),true);
  addBox(0,.89,-3.27,1.8,.7,1.15,gold,true);
  addBox(0,1.72,-3.73,1.65,1.8,.35,solid(0x6d4b72),true);
  const trim=new THREE.Mesh(new THREE.TorusGeometry(.82,.07,8,40),gold);
  trim.position.set(0,3.05,-3.55);group.add(trim);
  // 3D crown made from a ring and seven spires topped with jewels.
  const crown=new THREE.Group();
  crown.position.set(0,2.28,-3.05);
  const band=new THREE.Mesh(new THREE.TorusGeometry(.48,.105,8,24),gold);
  band.rotation.x=Math.PI/2;band.position.y=-.21;crown.add(band);
  for(let i=0;i<7;i++){
    const a=i*Math.PI*2/7,x=Math.sin(a)*.43,z=Math.cos(a)*.43;
    const spike=new THREE.Mesh(new THREE.ConeGeometry(.11,.56,8),gold);
    spike.position.set(x,.08,z);crown.add(spike);
    const jewel=new THREE.Mesh(new THREE.SphereGeometry(.083,9,6),luminous);
    jewel.position.set(x,.4,z);crown.add(jewel);
  }
  const centerGem=new THREE.Mesh(new THREE.OctahedronGeometry(.27,0),new THREE.MeshStandardMaterial({
    color:0xeeedb7,emissive:0xf1c17a,emissiveIntensity:1.65,metalness:.2
  }));
  centerGem.position.y=.08;crown.add(centerGem);
  crown.userData.isCrown=true;group.add(crown);
  const crownHalo=new THREE.Mesh(new THREE.TorusGeometry(.79,.046,8,42),
    new THREE.MeshBasicMaterial({color:0xffd38a,transparent:true,opacity:.9}));
  crownHalo.position.copy(crown.position);group.add(crownHalo);
  const crownLight=new THREE.PointLight(0xf1bd6e,9,5);crownLight.position.copy(crown.position);group.add(crownLight);
  return {group,roomId:"vault",title:"Mật Thất Vương Miện",relic:crown,relicHalo:crownHalo,colliders};
}
