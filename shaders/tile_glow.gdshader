shader_type canvas_item;

uniform vec4 glow_color : source_color = vec4(1.0, 0.85, 0.25, 1.0);
uniform float glow_strength = 0.0;

void fragment() {
	vec4 base = texture(TEXTURE, UV) * COLOR;
	base.rgb += glow_color.rgb * glow_strength * base.a;
	COLOR = base;
}
