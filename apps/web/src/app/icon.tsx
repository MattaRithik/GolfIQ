import { ImageResponse } from 'next/og';

export const size = { width: 32, height: 32 };
export const contentType = 'image/png';

export default function Icon() {
  return new ImageResponse(
    (
      <div
        style={{
          width: 32,
          height: 32,
          background: 'linear-gradient(135deg, #15803d 0%, #22c55e 100%)',
          borderRadius: 8,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          boxShadow: '0 2px 8px rgba(34,197,94,0.4)',
        }}
      >
        {/* Golf flag pole */}
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'flex-start',
            justifyContent: 'flex-end',
            height: 22,
            position: 'relative',
          }}
        >
          {/* Flag */}
          <div
            style={{
              width: 10,
              height: 7,
              background: 'white',
              position: 'absolute',
              top: 0,
              left: 3,
              borderRadius: '0 2px 2px 0',
            }}
          />
          {/* Pole */}
          <div
            style={{
              width: 2,
              height: 22,
              background: 'rgba(255,255,255,0.9)',
              borderRadius: 1,
              position: 'absolute',
              left: 3,
              top: 0,
            }}
          />
          {/* Ball */}
          <div
            style={{
              width: 8,
              height: 8,
              background: 'white',
              borderRadius: '50%',
              position: 'absolute',
              bottom: 0,
              left: 8,
            }}
          />
        </div>
      </div>
    ),
    { width: 32, height: 32 }
  );
}
