shader_type canvas_item;

uniform vec4 top_color : source_color = vec4(0.02, 0.36, 0.24, 1.0);
uniform vec4 mid_color : source_color = vec4(0.00, 0.22, 0.17, 1.0);
uniform vec4 bottom_color : source_color = vec4(0.00, 0.10, 0.08, 1.0);
uniform float vignette_strength = 0.58;

void fragment() {
	float y = UV.y;
	vec4 grad = mix(top_color, mid_color, smoothstep(0.0, 0.52, y));
	grad = mix(grad, bottom_color, smoothstep(0.42, 1.0, y));
	float center_light = 1.0 - smoothstep(0.0, 0.70, distance(UV, vec2(0.5, 0.30)));
	float contour = smoothstep(0.965, 1.0, sin((UV.x * 18.0 + UV.y * 12.0) + sin(UV.y * 28.0) * 0.9));
	float fiber = sin((UV.x + UV.y * 0.38) * 118.0) * 0.008;
	float dist = distance(UV, vec2(0.5, 0.42));
	float vignette = smoothstep(0.30, 0.88, dist) * vignette_strength;
	vec3 color = grad.rgb + vec3(center_light * 0.065 + fiber) + vec3(0.02, 0.11, 0.08) * contour * 0.45;
	COLOR = vec4(color * (1.0 - vignette), 1.0);
}
