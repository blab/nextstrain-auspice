rm -rf data/
mkdir -p data/

datasets=( "manifest_guest.json" "manifest_mumps.json"
  "img_ebola.png"\
  "ebola_tree.json" "ebola_sequences.json" "ebola_meta.json" "ebola_entropy.json"\
  "img_zika.png"\
  "zika_tree.json" "zika_sequences.json" "zika_meta.json" "zika_entropy.json"\
  "img_seasonalinfluenza.png"\
  "flu_h3n2_ha_3y_tree.json" "flu_h3n2_ha_3y_sequences.json" "flu_h3n2_ha_3y_meta.json" "flu_h3n2_ha_3y_entropy.json"\
  "flu_h3n2_ha_6y_tree.json" "flu_h3n2_ha_6y_sequences.json" "flu_h3n2_ha_6y_meta.json" "flu_h3n2_ha_6y_entropy.json"\
  "flu_h3n2_ha_12y_tree.json" "flu_h3n2_ha_12y_sequences.json" "flu_h3n2_ha_12y_meta.json" "flu_h3n2_ha_12y_entropy.json"\
  "flu_h1n1pdm_ha_3y_tree.json" "flu_h1n1pdm_ha_3y_sequences.json" "flu_h1n1pdm_ha_3y_meta.json" "flu_h1n1pdm_ha_3y_entropy.json"\
  "flu_h1n1pdm_ha_6y_tree.json" "flu_h1n1pdm_ha_6y_sequences.json" "flu_h1n1pdm_ha_6y_meta.json" "flu_h1n1pdm_ha_6y_entropy.json"\
  "flu_h1n1pdm_ha_12y_tree.json" "flu_h1n1pdm_ha_12y_sequences.json" "flu_h1n1pdm_ha_12y_meta.json" "flu_h1n1pdm_ha_12y_entropy.json"\
  "flu_vic_ha_3y_tree.json" "flu_vic_ha_3y_sequences.json" "flu_vic_ha_3y_meta.json" "flu_vic_ha_3y_entropy.json"\
  "flu_vic_ha_6y_tree.json" "flu_vic_ha_6y_sequences.json" "flu_vic_ha_6y_meta.json" "flu_vic_ha_6y_entropy.json"\
  "flu_vic_ha_12y_tree.json" "flu_vic_ha_12y_sequences.json" "flu_vic_ha_12y_meta.json" "flu_vic_ha_12y_entropy.json"\
  "flu_yam_ha_3y_tree.json" "flu_yam_ha_3y_sequences.json" "flu_yam_ha_3y_meta.json" "flu_yam_ha_3y_entropy.json"\
  "flu_yam_ha_6y_tree.json" "flu_yam_ha_6y_sequences.json" "flu_yam_ha_6y_meta.json" "flu_yam_ha_6y_entropy.json"\
  "flu_yam_ha_12y_tree.json" "flu_yam_ha_12y_sequences.json" "flu_yam_ha_12y_meta.json" "flu_yam_ha_12y_entropy.json"\
  "img_avianinfluenza.png"\
  "avian_h7n9_ha_tree.json" "avian_h7n9_ha_sequences.json" "avian_h7n9_ha_meta.json" "avian_h7n9_ha_entropy.json"\
  "avian_h7n9_mp_tree.json" "avian_h7n9_mp_sequences.json" "avian_h7n9_mp_meta.json" "avian_h7n9_mp_entropy.json"\
  "avian_h7n9_na_tree.json" "avian_h7n9_na_sequences.json" "avian_h7n9_na_meta.json" "avian_h7n9_na_entropy.json"\
  "avian_h7n9_np_tree.json" "avian_h7n9_np_sequences.json" "avian_h7n9_np_meta.json" "avian_h7n9_np_entropy.json"\
  "avian_h7n9_ns_tree.json" "avian_h7n9_ns_sequences.json" "avian_h7n9_ns_meta.json" "avian_h7n9_ns_entropy.json"\
  "avian_h7n9_pa_tree.json" "avian_h7n9_pa_sequences.json" "avian_h7n9_pa_meta.json" "avian_h7n9_pa_entropy.json"\
  "avian_h7n9_pb1_tree.json" "avian_h7n9_pb1_sequences.json" "avian_h7n9_pb1_meta.json" "avian_h7n9_pb1_entropy.json"\
  "avian_h7n9_pb2_tree.json" "avian_h7n9_pb2_sequences.json" "avian_h7n9_pb2_meta.json" "avian_h7n9_pb2_entropy.json"\
  "img_dengue.png"\
  "dengue_all_tree.json" "dengue_all_sequences.json" "dengue_all_meta.json" "dengue_all_entropy.json"\
  "dengue_denv1_tree.json" "dengue_denv1_sequences.json" "dengue_denv1_meta.json" "dengue_denv1_entropy.json"\
  "dengue_denv2_tree.json" "dengue_denv2_sequences.json" "dengue_denv2_meta.json" "dengue_denv2_entropy.json"\
  "dengue_denv3_tree.json" "dengue_denv3_sequences.json" "dengue_denv3_meta.json" "dengue_denv3_entropy.json"\
  "dengue_denv4_tree.json" "dengue_denv4_sequences.json" "dengue_denv4_meta.json" "dengue_denv4_entropy.json"\
  "img_mumps.jpg"\
  "mumps_global_tree.json" "mumps_global_sequences.json" "mumps_global_meta.json" "mumps_global_entropy.json"\
  "mumps_bc_tree.json" "mumps_bc_sequences.json" "mumps_bc_meta.json" "mumps_bc_entropy.json"\
  "mumps_mass_tree.json" "mumps_mass_sequences.json" "mumps_mass_meta.json" "mumps_mass_entropy.json"\
  )

for i in "${datasets[@]}"
do
  curl http://data.nextstrain.org/${i} --compressed -o data/${i}
done
