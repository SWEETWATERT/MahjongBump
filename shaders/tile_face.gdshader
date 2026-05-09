shader_type canvas_item;

uniform vec4 top_color : source_color = vec4(1.00, 0.99, 0.88, 1.0);
uniform vec4 bottom_color : source_color = vec4(0.88, 0.78, 0.52, 1.0);
uniform vec4 rim_color : source_color = vec4(1.0, 0.95, 0.72, 1.0);

void fragment() {
	vec2 uv = UV;
	float y = smoothstep(0.0, 1.0, uv.y);
	vec3 base = mix(top_color.rgb, bottom_color.rgb, y);
	float rim = 1.0 - min(min(uv.x, 1.0 - uv.x), min(uv.y, 1.0 - uv.y)) * 8.0;
	rim = clamp(rim, 0.0, 1.0);
	float soft_highlight = 1.0 - smoothstep(0.0, 0.55, distance(uv, vec2(0.38, 0.18)));
	vec3 color = base + rim_color.rgb * rim * 0.16 + vec3(soft_highlight * 0.10);
	COLOR = vec4(color, 1.0) * COLOR;
}
