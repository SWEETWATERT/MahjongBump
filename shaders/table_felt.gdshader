shader_type canvas_item;

uniform vec4 top_color : source_color = vec4(0.02, 0.39, 0.27, 1.0);
uniform vec4 bottom_color : source_color = vec4(0.00, 0.18, 0.14, 1.0);
uniform float vignette_strength = 0.42;

void fragment() {
	vec2 uv = UV;
	vec3 base = mix(top_color.rgb, bottom_color.rgb, smoothstep(0.0, 1.0, uv.y));
	float weave_a = sin((uv.x * 120.0) + (uv.y * 32.0)) * 0.010;
	float weave_b = sin((uv.y * 150.0) - (uv.x * 22.0)) * 0.008;
	float contour = smoothstep(0.975, 1.0, sin((uv.x * 26.0) + sin(uv.y * 34.0) * 1.1 + uv.y * 9.0));
	float center = 1.0 - smoothstep(0.0, 0.72, distance(uv, vec2(0.5, 0.38)));
	float vignette = smoothstep(0.28, 0.82, distance(uv, vec2(0.5, 0.45))) * vignette_strength;
	vec3 color = base + vec3(weave_a + weave_b + center * 0.055) + vec3(0.00, 0.14, 0.10) * contour * 0.55;
	COLOR = vec4(color * (1.0 - vignette), 1.0) * COLOR;
}
