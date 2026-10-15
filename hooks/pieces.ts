// ascii.rest's art pieces (MIT, by bas3line; see pieces/LICENSE-ascii-rest), brand logos left out.
// Generated from the pieces' metadata: one import and one row per piece.
import type { PieceModule } from './catalog-types.ts'

import * as p_aquarium from './pieces/aquarium.js'
import * as p_butterfly from './pieces/butterfly.js'
import * as p_cat from './pieces/cat.js'
import * as p_fox from './pieces/fox.js'
import * as p_jellyfish from './pieces/jellyfish.js'
import * as p_owl from './pieces/owl.js'
import * as p_snake from './pieces/snake.js'
import * as p_spider from './pieces/spider.js'
import * as p_starlings from './pieces/starlings.js'
import * as p_whale from './pieces/whale.js'
import * as p_doom_fire from './pieces/doom-fire.js'
import * as p_fireworks from './pieces/fireworks.js'
import * as p_matrix_rain from './pieces/matrix-rain.js'
import * as p_rotozoomer from './pieces/rotozoomer.js'
import * as p_sparks from './pieces/sparks.js'
import * as p_synthwave from './pieces/synthwave.js'
import * as p_tunnel from './pieces/tunnel.js'
import * as p_tv_static from './pieces/tv-static.js'
import * as p_epicycles from './pieces/epicycles.js'
import * as p_flow_field from './pieces/flow-field.js'
import * as p_glider_gun from './pieces/glider-gun.js'
import * as p_hilbert_curve from './pieces/hilbert-curve.js'
import * as p_julia_set from './pieces/julia-set.js'
import * as p_langtons_ant from './pieces/langtons-ant.js'
import * as p_mandelbrot from './pieces/mandelbrot.js'
import * as p_maze from './pieces/maze.js'
import * as p_plasma from './pieces/plasma.js'
import * as p_reaction_diffusion from './pieces/reaction-diffusion.js'
import * as p_rule_30 from './pieces/rule-30.js'
import * as p_sierpinski from './pieces/sierpinski.js'
import * as p_voronoi from './pieces/voronoi.js'
import * as p_aurora from './pieces/aurora.js'
import * as p_bonsai from './pieces/bonsai.js'
import * as p_campfire from './pieces/campfire.js'
import * as p_cherry_blossom from './pieces/cherry-blossom.js'
import * as p_contour_map from './pieces/contour-map.js'
import * as p_fern from './pieces/fern.js'
import * as p_fireflies from './pieces/fireflies.js'
import * as p_fractal_tree from './pieces/fractal-tree.js'
import * as p_landscape from './pieces/landscape.js'
import * as p_lightning from './pieces/lightning.js'
import * as p_rain from './pieces/rain.js'
import * as p_ruled_mountains from './pieces/ruled-mountains.js'
import * as p_sea_swell from './pieces/sea-swell.js'
import * as p_snowfall from './pieces/snowfall.js'
import * as p_sunrise from './pieces/sunrise.js'
import * as p_wind from './pieces/wind.js'
import * as p_analog_clock from './pieces/analog-clock.js'
import * as p_candle from './pieces/candle.js'
import * as p_coffee from './pieces/coffee.js'
import * as p_ferris_wheel from './pieces/ferris-wheel.js'
import * as p_hawa_mahal from './pieces/hawa-mahal.js'
import * as p_hourglass from './pieces/hourglass.js'
import * as p_kite from './pieces/kite.js'
import * as p_lava_lamp from './pieces/lava-lamp.js'
import * as p_lighthouse from './pieces/lighthouse.js'
import * as p_skyline from './pieces/skyline.js'
import * as p_sundial from './pieces/sundial.js'
import * as p_train from './pieces/train.js'
import * as p_vinyl from './pieces/vinyl.js'
import * as p_windmill from './pieces/windmill.js'
import * as p_bouncing_balls from './pieces/bouncing-balls.js'
import * as p_chladni from './pieces/chladni.js'
import * as p_double_pendulum from './pieces/double-pendulum.js'
import * as p_falling_sand from './pieces/falling-sand.js'
import * as p_flag from './pieces/flag.js'
import * as p_fountain from './pieces/fountain.js'
import * as p_harmonograph from './pieces/harmonograph.js'
import * as p_lorenz from './pieces/lorenz.js'
import * as p_newtons_cradle from './pieces/newtons-cradle.js'
import * as p_pendulum_wave from './pieces/pendulum-wave.js'
import * as p_plucked_string from './pieces/plucked-string.js'
import * as p_pond_ripples from './pieces/pond-ripples.js'
import * as p_smoke from './pieces/smoke.js'
import * as p_wave_interference from './pieces/wave-interference.js'
import * as p_alpine_dawn from './pieces/alpine-dawn.js'
import * as p_amer_fort from './pieces/amer-fort.js'
import * as p_aurora_fjord from './pieces/aurora-fjord.js'
import * as p_cloud_sea from './pieces/cloud-sea.js'
import * as p_deep_reef from './pieces/deep-reef.js'
import * as p_desert_night from './pieces/desert-night.js'
import * as p_earthrise from './pieces/earthrise.js'
import * as p_edge_orbit from './pieces/edge-orbit.js'
import * as p_gangaur_ghat from './pieces/gangaur-ghat.js'
import * as p_jal_mahal from './pieces/jal-mahal.js'
import * as p_jungle_falls from './pieces/jungle-falls.js'
import * as p_kite_festival from './pieces/kite-festival.js'
import * as p_kyoto_dusk from './pieces/kyoto-dusk.js'
import * as p_lake_pichola from './pieces/lake-pichola.js'
import * as p_lantern_lake from './pieces/lantern-lake.js'
import * as p_marine_drive from './pieces/marine-drive.js'
import * as p_misty_forest from './pieces/misty-forest.js'
import * as p_night_coast from './pieces/night-coast.js'
import * as p_night_highway from './pieces/night-highway.js'
import * as p_ocean_sunset from './pieces/ocean-sunset.js'
import * as p_saturn_rise from './pieces/saturn-rise.js'
import * as p_snow_train from './pieces/snow-train.js'
import * as p_storm_plains from './pieces/storm-plains.js'
import * as p_taj_dawn from './pieces/taj-dawn.js'
import * as p_tokyo_rain from './pieces/tokyo-rain.js'
import * as p_varanasi_ghats from './pieces/varanasi-ghats.js'
import * as p_volcano_night from './pieces/volcano-night.js'
import * as p_cube from './pieces/cube.js'
import * as p_dna_helix from './pieces/dna-helix.js'
import * as p_donut from './pieces/donut.js'
import * as p_glxgears from './pieces/glxgears.js'
import * as p_gyroscope from './pieces/gyroscope.js'
import * as p_heart from './pieces/heart.js'
import * as p_icosahedron from './pieces/icosahedron.js'
import * as p_mobius_strip from './pieces/mobius-strip.js'
import * as p_spring from './pieces/spring.js'
import * as p_tesseract from './pieces/tesseract.js'
import * as p_torus_knot from './pieces/torus-knot.js'
import * as p_twisted_ring from './pieces/twisted-ring.js'
import * as p_black_hole from './pieces/black-hole.js'
import * as p_earth from './pieces/earth.js'
import * as p_eclipse from './pieces/eclipse.js'
import * as p_galaxy from './pieces/galaxy.js'
import * as p_moon_phases from './pieces/moon-phases.js'
import * as p_planet from './pieces/planet.js'
import * as p_rocket from './pieces/rocket.js'
import * as p_saptarishi from './pieces/saptarishi.js'
import * as p_solar_system from './pieces/solar-system.js'
import * as p_starfield from './pieces/starfield.js'
import * as p_three_body from './pieces/three-body.js'
import * as p_equalizer from './pieces/equalizer.js'

export type PieceRow = { id: string; cat: string; note: string; piece: PieceModule }

export const PIECES: PieceRow[] = [
  { id: "aquarium", cat: "creatures", note: "fish swimming and turning in a tank, bubbles and weed", piece: p_aquarium as PieceModule },
  { id: "butterfly", cat: "creatures", note: "a butterfly flapping and gliding along a wandering path", piece: p_butterfly as PieceModule },
  { id: "cat", cat: "creatures", note: "a tabby asleep on its paws, breathing slowly", piece: p_cat as PieceModule },
  { id: "fox", cat: "creatures", note: "a fox asleep on its tail, breathing, peeking now and then", piece: p_fox as PieceModule },
  { id: "jellyfish", cat: "creatures", note: "a jellyfish pulsing upward, its tentacles trailing late", piece: p_jellyfish as PieceModule },
  { id: "owl", cat: "creatures", note: "an owl on a branch, blinking slowly and turning its head", piece: p_owl as PieceModule },
  { id: "snake", cat: "creatures", note: "a snake slithering along an s-curve, flicking its tongue", piece: p_snake as PieceModule },
  { id: "spider", cat: "creatures", note: "a spider lowering itself on silk, then climbing back up", piece: p_spider as PieceModule },
  { id: "starlings", cat: "creatures", note: "a murmuration wheeling about, split by a passing falcon", piece: p_starlings as PieceModule },
  { id: "whale", cat: "creatures", note: "a whale blows, arches its back and dives, fluke last", piece: p_whale as PieceModule },
  { id: "doom-fire", cat: "effects", note: "the psx fire spread, tongues climbing off a white-hot bed", piece: p_doom_fire as PieceModule },
  { id: "fireworks", cat: "effects", note: "shells climb and burst as peonies, rings, willows and palms", piece: p_fireworks as PieceModule },
  { id: "matrix-rain", cat: "effects", note: "streams of glyphs falling, heavy at the head, thin behind", piece: p_matrix_rain as PieceModule },
  { id: "rotozoomer", cat: "effects", note: "a brick wall texture turning and zooming about the centre", piece: p_rotozoomer as PieceModule },
  { id: "sparks", cat: "effects", note: "an angle grinder throwing sparks that arc, skip and cool", piece: p_sparks as PieceModule },
  { id: "synthwave", cat: "effects", note: "a grid rolling toward a striped sun behind a mountain ridge", piece: p_synthwave as PieceModule },
  { id: "tunnel", cat: "effects", note: "flying down a tiled tube that bends and twists", piece: p_tunnel as PieceModule },
  { id: "tv-static", cat: "effects", note: "snow on an old set that tunes into a test card and loses it", piece: p_tv_static as PieceModule },
  { id: "epicycles", cat: "generative", note: "a chain of turning circles whose tip traces a star", piece: p_epicycles as PieceModule },
  { id: "flow-field", cat: "generative", note: "particle trails gathering into winding, merging streams", piece: p_flow_field as PieceModule },
  { id: "glider-gun", cat: "generative", note: "gosper's gun firing a glider every 30 generations", piece: p_glider_gun as PieceModule },
  { id: "hilbert-curve", cat: "generative", note: "a closed loop of two hilbert curves, with two lit runners", piece: p_hilbert_curve as PieceModule },
  { id: "julia-set", cat: "generative", note: "a julia set changing shape as its constant c goes round", piece: p_julia_set as PieceModule },
  { id: "langtons-ant", cat: "generative", note: "order, then chaos, then the ant builds its highway", piece: p_langtons_ant as PieceModule },
  { id: "mandelbrot", cat: "generative", note: "a slow zoom into seahorse valley and back out again", piece: p_mandelbrot as PieceModule },
  { id: "maze", cat: "generative", note: "a maze carved by backtracking, then solved, then remade", piece: p_maze as PieceModule },
  { id: "plasma", cat: "generative", note: "soft interference blobs drifting and pulsing", piece: p_plasma as PieceModule },
  { id: "reaction-diffusion", cat: "generative", note: "gray-scott spots and stripes dying back and growing out", piece: p_reaction_diffusion as PieceModule },
  { id: "rule-30", cat: "generative", note: "one cell grows a row at a time under rules 30, 90 and 110", piece: p_rule_30 as PieceModule },
  { id: "sierpinski", cat: "generative", note: "the chaos game filling a sierpinski triangle point by point", piece: p_sierpinski as PieceModule },
  { id: "voronoi", cat: "generative", note: "cells of ground nearest each drifting seed", piece: p_voronoi as PieceModule },
  { id: "aurora", cat: "nature", note: "an aurora curtain rippling over a treeline under stars", piece: p_aurora as PieceModule },
  { id: "bonsai", cat: "nature", note: "a potted tree that sheds its leaves and leafs out again", piece: p_bonsai as PieceModule },
  { id: "campfire", cat: "nature", note: "a log fire flickering, sparks rising; denser ink is hotter", piece: p_campfire as PieceModule },
  { id: "cherry-blossom", cat: "nature", note: "a flowering cherry branch shedding petals on the wind", piece: p_cherry_blossom as PieceModule },
  { id: "contour-map", cat: "nature", note: "an island in contour lines, its hills slowly reshaping", piece: p_contour_map as PieceModule },
  { id: "fern", cat: "nature", note: "barnsley's fern filling in point by point, then swaying", piece: p_fern as PieceModule },
  { id: "fireflies", cat: "nature", note: "fireflies over night grass, a flash spreading through them", piece: p_fireflies as PieceModule },
  { id: "fractal-tree", cat: "nature", note: "a recursive branching tree swaying in the wind", piece: p_fractal_tree as PieceModule },
  { id: "landscape", cat: "nature", note: "a range and a lake under the sun or moon of the local hour", piece: p_landscape as PieceModule },
  { id: "lightning", cat: "nature", note: "a forked bolt striking out of a storm cloud in the rain", piece: p_lightning as PieceModule },
  { id: "rain", cat: "nature", note: "slanting rain in three depths, crowns and puddle rings", piece: p_rain as PieceModule },
  { id: "ruled-mountains", cat: "nature", note: "ruled lines with a range rising from them, drifting forward", piece: p_ruled_mountains as PieceModule },
  { id: "sea-swell", cat: "nature", note: "a long swell lifting a small sailboat as it rolls under", piece: p_sea_swell as PieceModule },
  { id: "snowfall", cat: "nature", note: "snow swaying down, building drifts on the ground and a fence", piece: p_snowfall as PieceModule },
  { id: "sunrise", cat: "nature", note: "the sun lifting off a sea horizon, its path glittering", piece: p_sunrise as PieceModule },
  { id: "wind", cat: "nature", note: "gusts streaming along bending lines, curling at the head", piece: p_wind as PieceModule },
  { id: "analog-clock", cat: "objects", note: "a round clock face showing the local time, seconds ticking", piece: p_analog_clock as PieceModule },
  { id: "candle", cat: "objects", note: "a flickering candle burning down in its holder, then renewed", piece: p_candle as PieceModule },
  { id: "coffee", cat: "objects", note: "steam curling up from a cup of coffee on its saucer", piece: p_coffee as PieceModule },
  { id: "ferris-wheel", cat: "objects", note: "a wheel turning on its a-frame, cabins hanging upright", piece: p_ferris_wheel as PieceModule },
  { id: "hawa-mahal", cat: "objects", note: "jaipur's palace of winds at night, lamps behind the jali", piece: p_hawa_mahal as PieceModule },
  { id: "hourglass", cat: "objects", note: "sand running through the neck, then turned over", piece: p_hourglass as PieceModule },
  { id: "kite", cat: "objects", note: "a diamond kite riding the wind, its string sagging in lulls", piece: p_kite as PieceModule },
  { id: "lava-lamp", cat: "objects", note: "wax blobs rising, merging and sinking in a lit glass", piece: p_lava_lamp as PieceModule },
  { id: "lighthouse", cat: "objects", note: "a beam sweeping over night sea from a lighthouse on rocks", piece: p_lighthouse as PieceModule },
  { id: "skyline", cat: "objects", note: "a city at night, windows going on and off, a blinking mast", piece: p_skyline as PieceModule },
  { id: "sundial", cat: "objects", note: "jaipur's samrat yantra, its shadow set by your local time", piece: p_sundial as PieceModule },
  { id: "train", cat: "objects", note: "a steam train crossing on its track, smoke puffing behind", piece: p_train as PieceModule },
  { id: "vinyl", cat: "objects", note: "a record turning under the tonearm, seen from above", piece: p_vinyl as PieceModule },
  { id: "windmill", cat: "objects", note: "four lattice sails turning on a dutch mill, clouds passing", piece: p_windmill as PieceModule },
  { id: "bouncing-balls", cat: "physics", note: "rubber balls bouncing lower each time, squashing on landing", piece: p_bouncing_balls as PieceModule },
  { id: "chladni", cat: "physics", note: "sand travelling to the nodal lines of a ringing plate", piece: p_chladni as PieceModule },
  { id: "double-pendulum", cat: "physics", note: "a chaotic double pendulum; its tip leaves a fading trail", piece: p_double_pendulum as PieceModule },
  { id: "falling-sand", cat: "physics", note: "sand pouring into a heap, then draining through the shelf", piece: p_falling_sand as PieceModule },
  { id: "flag", cat: "physics", note: "a striped flag rippling on a pole, folds catching the light", piece: p_flag as PieceModule },
  { id: "fountain", cat: "physics", note: "arcs of water from a nozzle falling as drops into a basin", piece: p_fountain as PieceModule },
  { id: "harmonograph", cat: "physics", note: "a pen on two decaying pendulums winding a figure inward", piece: p_harmonograph as PieceModule },
  { id: "lorenz", cat: "physics", note: "one lorenz trajectory looping both wings, older loops fading", piece: p_lorenz as PieceModule },
  { id: "newtons-cradle", cat: "physics", note: "five steel balls on strings passing one knock back and forth", piece: p_newtons_cradle as PieceModule },
  { id: "pendulum-wave", cat: "physics", note: "a row of pendulums drifting in and out of step, from above", piece: p_pendulum_wave as PieceModule },
  { id: "plucked-string", cat: "physics", note: "a plucked string, slowed down, its harmonics fading", piece: p_plucked_string as PieceModule },
  { id: "pond-ripples", cat: "physics", note: "raindrops opening rings that cross and fade on a pond", piece: p_pond_ripples as PieceModule },
  { id: "smoke", cat: "physics", note: "incense smoke rising straight, then curling and thinning", piece: p_smoke as PieceModule },
  { id: "wave-interference", cat: "physics", note: "two sources in a ripple tank, still lines fanning out", piece: p_wave_interference as PieceModule },
  { id: "alpine-dawn", cat: "scenes", note: "snow peaks catching first light above a still, misty mountain lake", piece: p_alpine_dawn as PieceModule },
  { id: "amer-fort", cat: "scenes", note: "amer fort floodlit gold on its hill, mirrored in maota lake at night", piece: p_amer_fort as PieceModule },
  { id: "aurora-fjord", cat: "scenes", note: "aurora curtains rippling over a still fjord, a cabin lit on the shore", piece: p_aurora_fjord as PieceModule },
  { id: "cloud-sea", cat: "scenes", note: "the sun sinks into a drifting sea of orange cloud at dusk", piece: p_cloud_sea as PieceModule },
  { id: "deep-reef", cat: "scenes", note: "light shafts, swaying kelp and a turning school of fish over a reef", piece: p_deep_reef as PieceModule },
  { id: "desert-night", cat: "scenes", note: "the milky way over a lone acacia on moonless dunes, meteors falling", piece: p_desert_night as PieceModule },
  { id: "earthrise", cat: "scenes", note: "the earth rising over a cratered lunar horizon in long low sunlight", piece: p_earthrise as PieceModule },
  { id: "edge-orbit", cat: "scenes", note: "the night earth from orbit, cloudflare requests arcing city to city", piece: p_edge_orbit as PieceModule },
  { id: "gangaur-ghat", cat: "scenes", note: "udaipur at night, a lit gateway on lake pichola and diyas on the water", piece: p_gangaur_ghat as PieceModule },
  { id: "jal-mahal", cat: "scenes", note: "the jaipur water palace floating on a misty lake at sunrise", piece: p_jal_mahal as PieceModule },
  { id: "jungle-falls", cat: "scenes", note: "a tiered waterfall in a rainforest gorge, spray, a rainbow and macaws", piece: p_jungle_falls as PieceModule },
  { id: "kite-festival", cat: "scenes", note: "sankranti kites crowding a golden sky over the pink roofs of jaipur", piece: p_kite_festival as PieceModule },
  { id: "kyoto-dusk", cat: "scenes", note: "a pagoda at dusk behind a cherry tree lit by a stone lantern", piece: p_kyoto_dusk as PieceModule },
  { id: "lake-pichola", cat: "scenes", note: "sunset on lake pichola, udaipur's palaces glowing over the water", piece: p_lake_pichola as PieceModule },
  { id: "lantern-lake", cat: "scenes", note: "sky lanterns rising over a still mountain lake, one let go from a boat", piece: p_lantern_lake as PieceModule },
  { id: "marine-drive", cat: "scenes", note: "mumbai's queen's necklace at night, lamps curving round the bay", piece: p_marine_drive as PieceModule },
  { id: "misty-forest", cat: "scenes", note: "pine ridges fading into morning fog, sunbeams slanting through", piece: p_misty_forest as PieceModule },
  { id: "night-coast", cat: "scenes", note: "a lighthouse turning its beam under moonlit clouds over a dark sea", piece: p_night_coast as PieceModule },
  { id: "night-highway", cat: "scenes", note: "a desert highway at dusk, rushing toward the mountains and last light", piece: p_night_highway as PieceModule },
  { id: "ocean-sunset", cat: "scenes", note: "the sun sets past a pine headland, lit cloud, glitter on rolling sea", piece: p_ocean_sunset as PieceModule },
  { id: "saturn-rise", cat: "scenes", note: "saturn and its rings hanging over the cracked ice and geysers of a moon", piece: p_saturn_rise as PieceModule },
  { id: "snow-train", cat: "scenes", note: "a lit train crossing a snowy stone viaduct at night as snow falls", piece: p_snow_train as PieceModule },
  { id: "storm-plains", cat: "scenes", note: "an anvil thunderhead at dusk flickering over a wheat field", piece: p_storm_plains as PieceModule },
  { id: "taj-dawn", cat: "scenes", note: "the taj mahal at sunrise, mirrored in its pool through morning haze", piece: p_taj_dawn as PieceModule },
  { id: "tokyo-rain", cat: "scenes", note: "a tokyo side street in the rain, neon signs shining on the wet road", piece: p_tokyo_rain as PieceModule },
  { id: "varanasi-ghats", cat: "scenes", note: "dusk aarti on the ganga, lamps on the steps and diyas on the water", piece: p_varanasi_ghats as PieceModule },
  { id: "volcano-night", cat: "scenes", note: "a volcano erupting at night, lava rivers, an ash plume full of lightning", piece: p_volcano_night as PieceModule },
  { id: "cube", cat: "shapes", note: "a stippled hidden-line cube turning a quarter at a time", piece: p_cube as PieceModule },
  { id: "dna-helix", cat: "shapes", note: "a double helix with base pairs, turning about its axis", piece: p_dna_helix as PieceModule },
  { id: "donut", cat: "shapes", note: "a lit torus turning on two axes, after donut.c", piece: p_donut as PieceModule },
  { id: "glxgears", cat: "shapes", note: "three meshing gears turning, after glxgears", piece: p_glxgears as PieceModule },
  { id: "gyroscope", cat: "shapes", note: "gimbals swing round a spinning rotor whose axle holds still", piece: p_gyroscope as PieceModule },
  { id: "heart", cat: "shapes", note: "a glossy 3d heart swaying and beating lub-dub", piece: p_heart as PieceModule },
  { id: "icosahedron", cat: "shapes", note: "a wireframe icosahedron turning, its hidden edges dotted", piece: p_icosahedron as PieceModule },
  { id: "mobius-strip", cat: "shapes", note: "a mobius strip turning and nodding, lit from above", piece: p_mobius_strip as PieceModule },
  { id: "spring", cat: "shapes", note: "a weight bouncing on a coil spring, its coils bunching", piece: p_spring as PieceModule },
  { id: "tesseract", cat: "shapes", note: "a 4d hypercube turning, its cubes passing through each other", piece: p_tesseract as PieceModule },
  { id: "torus-knot", cat: "shapes", note: "a trefoil knot drawn as a lit tube, turning slowly", piece: p_torus_knot as PieceModule },
  { id: "twisted-ring", cat: "shapes", note: "a square ring twisted three quarters, so it has one face", piece: p_twisted_ring as PieceModule },
  { id: "black-hole", cat: "space", note: "a black hole, its lensed disk turning, one side brighter", piece: p_black_hole as PieceModule },
  { id: "earth", cat: "space", note: "a lit globe turning, continents from a five-degree map", piece: p_earth as PieceModule },
  { id: "eclipse", cat: "space", note: "the moon slides over the sun; diamond ring, then corona", piece: p_eclipse as PieceModule },
  { id: "galaxy", cat: "space", note: "a tilted spiral galaxy turning, its inner stars the fastest", piece: p_galaxy as PieceModule },
  { id: "moon-phases", cat: "space", note: "the moon waxing and waning, its maria darker in the light", piece: p_moon_phases as PieceModule },
  { id: "planet", cat: "space", note: "a banded ringed planet turning, with shadows both ways", piece: p_planet as PieceModule },
  { id: "rocket", cat: "space", note: "a rocket lifting off its pad at night, then landing back", piece: p_rocket as PieceModule },
  { id: "saptarishi", cat: "space", note: "the big dipper at true positions in a twinkling sky", piece: p_saptarishi as PieceModule },
  { id: "solar-system", cat: "space", note: "four planets on dotted orbits, periods by kepler's third law", piece: p_solar_system as PieceModule },
  { id: "starfield", cat: "space", note: "stars rush out from the centre and streak at the edges", piece: p_starfield as PieceModule },
  { id: "three-body", cat: "space", note: "three equal masses sharing one figure-eight orbit", piece: p_three_body as PieceModule },
  { id: "equalizer", cat: "effects", note: "bars rising and falling to a beat", piece: p_equalizer as PieceModule },
]
