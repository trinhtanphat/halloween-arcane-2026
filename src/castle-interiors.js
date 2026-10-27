/**
 * Four original procedural indoor environments for the Ravenhollow castle tour.
 * No external assets or physics engine; compact meshes + collision rectangles.
 * Scene space: x [-4.45,4.45], z [-4.45,4.45], eye at y=1.64.
 */
export function createCastleInterior(THREE, roomId) {
  const configs={
    hall:{color:0x6e567c,floor:0x493f54,accent:0xffc57f,title:"Đại Sảnh Bóng Đêm"},
    library:{color:0x554265,floor:0x3b2f44,accent:0xb99aff,title:"Thư Viện Bí Ẩn"},
    tower:{color:0x344e77,floor:0x33405a,accent:0xa9d8ff,title:"Tháp Thiên Văn"},
    crypt:{color:0x344947,floor:0x293e3c,accent:0x91d6a4,title:"Hầm Mộ Cổ"}
  };
  const c=configs[roomId]||configs.hall;
  const group=new THREE.Group();
  group.name="ravenhollow-interior-"+roomId;
  const colliders=[];
  const mat=(color,emissive=0,glow=0)=>new THREE.MeshStandardMaterial({color,emissive,emissiveIntensity:glow,roughness:.78,metalness:.1});
  const stone=mat(c.color),trim=mat(0x927b9c),floorMaterial=mat(c.floor);
  const gold=mat(c.accent,c.accent,.5);
  function box(x,y,z,w,h,d,material=stone,{collide=false}={}){
    const mesh=new THREE.Mesh(new THREE.BoxGeometry(w,h,d),material);
    mesh.position.set(x,y,z);group.add(mesh);
    if(collide)colliders.push({minX:x-w/2,maxX:x+w/2,minZ:z-d/2,maxZ:z+d/2});
    return mesh;
  }
  function sphere(x,y,z,r,material){
    const m=new THREE.Mesh(new THREE.SphereGeometry(r,14,10),material);
    m.position.set(x,y,z);group.add(m);return m;
  }
  function pillar(x,z){
    box(x,2.55,z,.45,5.1,.45,stone,{collide:true});
    box(x,4.85,z,.82,.25,.82,trim);
    box(x,.18,z,.84,.36,.84,trim);
  }
  function torch(x,y,z){
    box(x,y-.16,z,.15,.65,.18,trim);
    const m=new THREE.Mesh(new THREE.ConeGeometry(.15,.54,10),new THREE.MeshBasicMaterial({color:c.accent}));
    m.position.set(x,y+.31,z);group.add(m);
    const glow=new THREE.PointLight(c.accent,3.5,7);glow.position.set(x,y+.43,z);group.add(glow);
  }
  // Six surfaces form a genuine bounded interior with procedural decorations.
  box(0,-.22,0,9.4,.44,9.4,floorMaterial);
  box(0,5.15,0,9.4,.36,9.4,stone);
  box(-4.7,2.5,0,.36,5,9.4,stone);
  box(4.7,2.5,0,.36,5,9.4,stone);
  box(0,2.5,-4.7,9.4,5,.36,stone);
  box(0,2.5,4.7,9.4,5,.36,stone);
  // Wall trims, repeated slabs and a glowing arch behind the quest relic.
  for(const x of [-3.4,-1.15,1.15,3.4]){
    box(x,.055,0,.025,.02,9.2,trim);
    box(x,4.72,0,.12,.16,9.25,trim);
  }
  for(const z of [-3.1,-1,1.1,3.2])box(0,.053,z,9.2,.02,.026,trim);
  const ceilingPanel=new THREE.Mesh(
    new THREE.TorusGeometry(1.65,.045,7,32),
    new THREE.MeshBasicMaterial({color:c.accent,transparent:true,opacity:.45})
  );
  ceilingPanel.rotation.x=Math.PI/2;ceilingPanel.position.set(0,4.91,0);group.add(ceilingPanel);
  torch(-4.43,2.45,0);torch(4.43,2.45,0);
  group.add(new THREE.HemisphereLight(0xb7a5dc,0x251d31,1.5));
  const ambient=new THREE.PointLight(c.accent,25,14);ambient.position.set(0,3,-1.6);group.add(ambient);
  if(roomId==="hall"){
    for(const x of [-3.25,3.25])for(const z of [-2.65,2.65])pillar(x,z);
    // Long table and elevated candles at the heart of the banquet hall.
    box(0,.9,.45,2.45,.22,1.05,mat(0x67482f),{collide:true});
    for(const x of [-1.0,1.0])for(const z of [-.05,1])box(x,.45,z,.22,.72,.22,mat(0x57412f));
    for(const x of [-.82,0,.82]){
      box(x,1.2,.3,.16,.3,.16,mat(0xf0e2cc));
      sphere(x,1.49,.3,.1,mat(0xffdea7,0xffba51,1));
    }
    // A luminous suspended crown.
    const crown=new THREE.Mesh(new THREE.TorusGeometry(.73,.08,8,22),gold);
    crown.rotation.x=Math.PI/2;crown.position.set(0,3.65,-.5);group.add(crown);
  }else if(roomId==="library"){
    // Eight shelves, each filled with multicolored books using original meshes.
    const colors=[0x6e4154,0x506477,0x917143,0x46446c,0x75613b];
    for(const side of [-1,1])for(const z of [-2.9,-.9,1.1,3.1]){
      const x=side*3.83;
      box(x,2.18,z,.65,3.65,1.38,mat(0x66452f),{collide:true});
      for(let shelf=0;shelf<4;shelf++){
        box(x, .68+shelf*.81,z,.74,.11,1.45,mat(0x8a613f));
        for(let j=0;j<5;j++){
          const cover=mat(colors[(j+shelf+(side===1?1:0))%colors.length]);
          box(x,.93+shelf*.81,z-.51+j*.255,.34,.47,.21,cover);
        }
      }
    }
    // An enchanted open tome floats above a lectern.
    box(0,.91,-.35,1.1,1.6,1.05,mat(0x755436),{collide:true});
    box(-.25,1.83,-.36,.47,.06,.7,mat(0xf4e5c8));
    box(.25,1.83,-.36,.47,.06,.7,mat(0xf4e5c8));
    const halo=new THREE.Mesh(new THREE.TorusGeometry(.78,.04,8,34),new THREE.MeshBasicMaterial({color:c.accent}));
    halo.rotation.x=.34;halo.position.set(0,2.3,-.37);group.add(halo);
  }else if(roomId==="tower"){
    for(const x of [-3.7,3.7])for(const z of [-3.2,3.2])pillar(x,z);
    // Brass telescope aiming at a floating orrery.
    box(-1.55,.93,.5,.6,1.5,.6,mat(0xc4a46e),{collide:true});
    const scope=new THREE.Mesh(new THREE.CylinderGeometry(.22,.32,2.4,12),mat(0xc9a871));
    scope.rotation.z=.4;scope.rotation.x=-.6;scope.position.set(-1.55,1.95,.5);group.add(scope);
    const orbit=new THREE.Mesh(new THREE.TorusGeometry(1.15,.06,8,40),new THREE.MeshBasicMaterial({color:c.accent}));
    orbit.rotation.x=.45;orbit.position.set(1.1,2.4,-.4);group.add(orbit);
    sphere(1.1,2.4,-.4,.42,mat(0xe6d4f2,0xa5b5ff,.4));
    sphere(2.08,2.65,-.6,.15,mat(0xffdca6,0xffa963,.6));
    sphere(.3,2.15,-.15,.12,mat(0xa9f0ff,0x8accf5,.7));
    // Four illuminated star windows.
    for(const x of [-2.2,2.2])box(x,2.65,-4.47,.98,1.36,.11,mat(0x6b8fb9,0x4d93d5,.8));
  }else if(roomId==="crypt"){
    for(const x of [-3.2,3.2])for(const z of [-2.9,2.9])pillar(x,z);
    const sarcophagus=mat(0x777e75);
    box(0,.72,.2,1.46,1.05,2.15,sarcophagus,{collide:true});
    box(0,1.33,.2,1.7,.2,2.37,trim);
    const effigy=new THREE.Mesh(new THREE.CapsuleGeometry(.24,.78,4,8),gold);
    effigy.rotation.x=Math.PI/2;effigy.position.set(0,1.53,.23);group.add(effigy);
    for(const x of [-2.25,2.25]){
      box(x,.65,-2.4,1.1,1.12,1.2,sarcophagus,{collide:true});
      sphere(x,1.32,-2.4,.25,mat(0x99d3a7,0x5ab67b,.65));
    }
    for(const x of [-4.3,4.3])torch(x,1.9,-3);
  }
  // Relic must be approached in-world; button E opens the existing 2D riddle.
  const relic=new THREE.Mesh(
    new THREE.OctahedronGeometry(.43,1),
    new THREE.MeshStandardMaterial({color:c.accent,emissive:c.accent,emissiveIntensity:1.6,roughness:.18,metalness:.3})
  );
  relic.position.set(0,1.75,-3.15);
  relic.userData.isRelic=true;
  group.add(relic);
  const relicHalo=new THREE.Mesh(new THREE.TorusGeometry(.7,.045,7,38),new THREE.MeshBasicMaterial({color:c.accent}));
  relicHalo.position.copy(relic.position);group.add(relicHalo);
  const relicLight=new THREE.PointLight(c.accent,8,5);relicLight.position.copy(relic.position);group.add(relicLight);
  return {group,roomId,title:c.title,relic,relicHalo,colliders};
}
