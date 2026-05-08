shader_type canvas_item;

uniform vec4 top_color : source_color = vec4(0.07, 0.58, 0.36, 1.0);
uniform vec4 mid_color : source_color = vec4(0.03, 0.34, 0.21, 1.0);
uniform vec4 bottom_color : source_color = vec4(0.01, 0.16, 0.10, 1.0);
uniform float vignette_strength = 0.48;

void fragment() {
	float y = UV.y;
	vec4 grad = mix(top_color, mid_color, smoothstep(0.0, 0.52, y));
	grad = mix(grad, bottom_color, smoothstep(0.42, 1.0, y));
	float center_light = 1.0 - smoothstep(0.0, 0.62, distance(UV, vec2(0.5, 0.36)));
	float table_fiber = sin((UV.x + UV.y * 0.38) * 92.0) * 0.012;
	float dist = distance(UV, vec2(0.5, 0.42));
	float vignette = smoothstep(0.30, 0.88, dist) * vignette_strength;
	vec3 color = grad.rgb + vec3(center_light * 0.06 + table_fiber);
	COLOR = vec4(color * (1.0 - vignette), 1.0);
}
