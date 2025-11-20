import { ImageResponse } from 'next/og'
 
export const runtime = 'edge'
export const size = {
  width: 180,
  height: 180,
}
export const contentType = 'image/png'
 
export default function AppleIcon() {
  return new ImageResponse(
    (
      <div
        style={{
          fontSize: 96,
          background: 'linear-gradient(135deg, #3B82F6 0%, #8B5CF6 100%)',
          width: '100%',
          height: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: 'white',
          position: 'relative',
        }}
      >
        {/* Large orbit rings */}
        <div style={{ position: 'absolute', display: 'flex', width: '160px', height: '160px', border: '2px solid rgba(255,255,255,0.3)', borderRadius: '50%' }} />
        <div style={{ position: 'absolute', display: 'flex', width: '120px', height: '120px', border: '2px solid rgba(255,255,255,0.4)', borderRadius: '50%' }} />
        <div style={{ position: 'absolute', display: 'flex', width: '80px', height: '80px', border: '2px solid rgba(255,255,255,0.5)', borderRadius: '50%' }} />
        
        {/* Center circle with O */}
        <div style={{ display: 'flex', width: '60px', height: '60px', background: 'white', borderRadius: '50%', alignItems: 'center', justifyContent: 'center' }}>
          <div style={{ fontSize: '40px', fontWeight: 'bold', color: '#3B82F6' }}>O</div>
        </div>
        
        {/* Satellite dots */}
        <div style={{ position: 'absolute', top: '10px', left: '90px', width: '8px', height: '8px', background: 'rgba(96,165,250,0.8)', borderRadius: '50%' }} />
        <div style={{ position: 'absolute', top: '50px', right: '20px', width: '8px', height: '8px', background: 'white', borderRadius: '50%', opacity: 0.7 }} />
        <div style={{ position: 'absolute', bottom: '30px', left: '30px', width: '8px', height: '8px', background: 'white', borderRadius: '50%', opacity: 0.6 }} />
      </div>
    ),
    {
      ...size,
    }
  )
}
