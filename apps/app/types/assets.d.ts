// Ambient declarations for non-code side-effect imports.
// TS 6 (TS2882) requires a declaration for `import './x.css'` style imports;
// NativeWind consumes the CSS through Metro, not the type system.
declare module '*.css';
