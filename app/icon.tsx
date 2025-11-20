import { ImageResponse } from 'next/og'
 
export const runtime = 'edge'
export const size = {
  width: 32,
  height: 32,
}
export const contentType = 'image/png'
 
export default function Icon() {
  return new ImageResponse(
    (
      <div
        style={{
          fontSize: 24,
          background: 'linear-gradient(135deg, #3B82F6 0%, #8B5CF6 100%)',
          width: '100%',
          height: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: 'white',
          borderRadius: '8px',
          position: 'relative',
        }}
      >
        {/* Orbit rings */}
        <div style={{ position: 'absolute', display: 'flex', width: '28px', height: '28px', border: '1px solid rgba(255,255,255,0.3)', borderRadius: '50%' }} />
        <div style={{ position: 'absolute', display: 'flex', width: '20px', height: '20px', border: '1px solid rgba(255,255,255,0.4)', borderRadius: '50%' }} />
        
        {/* Center dot */}
        <div style={{ display: 'flex', width: '10px', height: '10px', background: 'white', borderRadius: '50%' }} />
      </div>
    ),
    {
      ...size,
    }
  )
}
