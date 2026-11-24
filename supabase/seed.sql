-- Généré par scripts/generate-seed.ts — ne pas modifier à la main.

insert into governorates (id, name_fr, name_ar) values
  ('tunis', 'Tunis', 'تونس'),
  ('ariana', 'Ariana', 'أريانة'),
  ('ben-arous', 'Ben Arous', 'بن عروس'),
  ('manouba', 'Manouba', 'منوبة'),
  ('nabeul', 'Nabeul', 'نابل'),
  ('zaghouan', 'Zaghouan', 'زغوان'),
  ('bizerte', 'Bizerte', 'بنزرت'),
  ('beja', 'Béja', 'باجة'),
  ('jendouba', 'Jendouba', 'جندوبة'),
  ('kef', 'Le Kef', 'الكاف'),
  ('siliana', 'Siliana', 'سليانة'),
  ('sousse', 'Sousse', 'سوسة'),
  ('monastir', 'Monastir', 'المنستير'),
  ('mahdia', 'Mahdia', 'المهدية'),
  ('sfax', 'Sfax', 'صفاقس'),
  ('kairouan', 'Kairouan', 'القيروان'),
  ('kasserine', 'Kasserine', 'القصرين'),
  ('sidi-bouzid', 'Sidi Bouzid', 'سيدي بوزيد'),
  ('gabes', 'Gabès', 'قابس'),
  ('medenine', 'Médenine', 'مدنين'),
  ('tataouine', 'Tataouine', 'تطاوين'),
  ('gafsa', 'Gafsa', 'قفصة'),
  ('tozeur', 'Tozeur', 'توزر'),
  ('kebili', 'Kébili', 'قبلي')
on conflict (id) do nothing;

insert into delegations (id, governorate_id, name_fr) values
  ('tunis-la-marsa', 'tunis', 'La Marsa'),
  ('tunis-carthage', 'tunis', 'Carthage'),
  ('tunis-le-bardo', 'tunis', 'Le Bardo'),
  ('tunis-sidi-hassine', 'tunis', 'Sidi Hassine'),
  ('ariana-ariana-ville', 'ariana', 'Ariana Ville'),
  ('ariana-kalaat-el-andalous', 'ariana', 'Kalâat el-Andalous'),
  ('ariana-sidi-thabet', 'ariana', 'Sidi Thabet'),
  ('ariana-raoued', 'ariana', 'Raoued'),
  ('ariana-mnihla', 'ariana', 'Mnihla'),
  ('ben-arous-mornag', 'ben-arous', 'Mornag'),
  ('ben-arous-mohamedia', 'ben-arous', 'Mohamedia'),
  ('ben-arous-fouchana', 'ben-arous', 'Fouchana'),
  ('ben-arous-hammam-lif', 'ben-arous', 'Hammam Lif'),
  ('ben-arous-rades', 'ben-arous', 'Radès'),
  ('manouba-tebourba', 'manouba', 'Tebourba'),
  ('manouba-mornaguia', 'manouba', 'Mornaguia'),
  ('manouba-borj-el-amri', 'manouba', 'Borj El Amri'),
  ('manouba-el-battan', 'manouba', 'El Battan'),
  ('manouba-jedaida', 'manouba', 'Jedaida'),
  ('nabeul-nabeul', 'nabeul', 'Nabeul'),
  ('nabeul-korba', 'nabeul', 'Korba'),
  ('nabeul-menzel-temime', 'nabeul', 'Menzel Temime'),
  ('nabeul-kelibia', 'nabeul', 'Kélibia'),
  ('nabeul-grombalia', 'nabeul', 'Grombalia'),
  ('nabeul-soliman', 'nabeul', 'Soliman'),
  ('nabeul-hammamet', 'nabeul', 'Hammamet'),
  ('nabeul-beni-khalled', 'nabeul', 'Béni Khalled'),
  ('nabeul-bou-argoub', 'nabeul', 'Bou Argoub'),
  ('nabeul-el-haouaria', 'nabeul', 'El Haouaria'),
  ('zaghouan-zaghouan', 'zaghouan', 'Zaghouan'),
  ('zaghouan-el-fahs', 'zaghouan', 'El Fahs'),
  ('zaghouan-nadhour', 'zaghouan', 'Nadhour'),
  ('zaghouan-bir-mcherga', 'zaghouan', 'Bir Mcherga'),
  ('zaghouan-zriba', 'zaghouan', 'Zriba'),
  ('zaghouan-saouaf', 'zaghouan', 'Saouaf'),
  ('bizerte-mateur', 'bizerte', 'Mateur'),
  ('bizerte-ras-jebel', 'bizerte', 'Ras Jebel'),
  ('bizerte-menzel-bourguiba', 'bizerte', 'Menzel Bourguiba'),
  ('bizerte-utique', 'bizerte', 'Utique'),
  ('bizerte-ghar-el-melh', 'bizerte', 'Ghar El Melh'),
  ('bizerte-sejnane', 'bizerte', 'Sejnane'),
  ('beja-beja-nord', 'beja', 'Béja Nord'),
  ('beja-beja-sud', 'beja', 'Béja Sud'),
  ('beja-medjez-el-bab', 'beja', 'Medjez el-Bab'),
  ('beja-testour', 'beja', 'Testour'),
  ('beja-teboursouk', 'beja', 'Téboursouk'),
  ('beja-nefza', 'beja', 'Nefza'),
  ('jendouba-jendouba', 'jendouba', 'Jendouba'),
  ('jendouba-bou-salem', 'jendouba', 'Bou Salem'),
  ('jendouba-tabarka', 'jendouba', 'Tabarka'),
  ('jendouba-ain-draham', 'jendouba', 'Ain Draham'),
  ('jendouba-fernana', 'jendouba', 'Fernana'),
  ('jendouba-ghardimaou', 'jendouba', 'Ghardimaou'),
  ('kef-le-kef-est', 'kef', 'Le Kef Est'),
  ('kef-le-kef-ouest', 'kef', 'Le Kef Ouest'),
  ('kef-dahmani', 'kef', 'Dahmani'),
  ('kef-tajerouine', 'kef', 'Tajerouine'),
  ('kef-sers', 'kef', 'Sers'),
  ('kef-nebeur', 'kef', 'Nebeur'),
  ('siliana-siliana-nord', 'siliana', 'Siliana Nord'),
  ('siliana-siliana-sud', 'siliana', 'Siliana Sud'),
  ('siliana-makthar', 'siliana', 'Makthar'),
  ('siliana-gaafour', 'siliana', 'Gaâfour'),
  ('siliana-bou-arada', 'siliana', 'Bou Arada'),
  ('siliana-rouhia', 'siliana', 'Rouhia'),
  ('sousse-enfidha', 'sousse', 'Enfidha'),
  ('sousse-msaken', 'sousse', 'Msaken'),
  ('sousse-kalaa-kebira', 'sousse', 'Kalâa Kebira'),
  ('sousse-sidi-bou-ali', 'sousse', 'Sidi Bou Ali'),
  ('sousse-bouficha', 'sousse', 'Bouficha'),
  ('sousse-kondar', 'sousse', 'Kondar'),
  ('monastir-monastir', 'monastir', 'Monastir'),
  ('monastir-jemmal', 'monastir', 'Jemmal'),
  ('monastir-moknine', 'monastir', 'Moknine'),
  ('monastir-ksar-hellal', 'monastir', 'Ksar Hellal'),
  ('monastir-bembla', 'monastir', 'Bembla'),
  ('monastir-sahline', 'monastir', 'Sahline'),
  ('mahdia-mahdia', 'mahdia', 'Mahdia'),
  ('mahdia-el-jem', 'mahdia', 'El Jem'),
  ('mahdia-chebba', 'mahdia', 'Chebba'),
  ('mahdia-ksour-essef', 'mahdia', 'Ksour Essef'),
  ('mahdia-souassi', 'mahdia', 'Souassi'),
  ('mahdia-chorbane', 'mahdia', 'Chorbane'),
  ('mahdia-ouled-chamekh', 'mahdia', 'Ouled Chamekh'),
  ('sfax-sakiet-ezzit', 'sfax', 'Sakiet Ezzit'),
  ('sfax-agareb', 'sfax', 'Agareb'),
  ('sfax-jebiniana', 'sfax', 'Jebiniana'),
  ('sfax-el-hencha', 'sfax', 'El Hencha'),
  ('sfax-menzel-chaker', 'sfax', 'Menzel Chaker'),
  ('sfax-mahres', 'sfax', 'Mahrès'),
  ('sfax-bir-ali-ben-khalifa', 'sfax', 'Bir Ali Ben Khalifa'),
  ('sfax-skhira', 'sfax', 'Skhira'),
  ('sfax-graiba', 'sfax', 'Graïba'),
  ('kairouan-kairouan-nord', 'kairouan', 'Kairouan Nord'),
  ('kairouan-kairouan-sud', 'kairouan', 'Kairouan Sud'),
  ('kairouan-haffouz', 'kairouan', 'Haffouz'),
  ('kairouan-sbikha', 'kairouan', 'Sbikha'),
  ('kairouan-oueslatia', 'kairouan', 'Oueslatia'),
  ('kairouan-bou-hajla', 'kairouan', 'Bou Hajla'),
  ('kairouan-nasrallah', 'kairouan', 'Nasrallah'),
  ('kairouan-chebika', 'kairouan', 'Chebika'),
  ('kasserine-kasserine-nord', 'kasserine', 'Kasserine Nord'),
  ('kasserine-sbeitla', 'kasserine', 'Sbeitla'),
  ('kasserine-feriana', 'kasserine', 'Fériana'),
  ('kasserine-thala', 'kasserine', 'Thala'),
  ('kasserine-foussana', 'kasserine', 'Foussana'),
  ('kasserine-sbiba', 'kasserine', 'Sbiba'),
  ('sidi-bouzid-sidi-bouzid-ouest', 'sidi-bouzid', 'Sidi Bouzid Ouest'),
  ('sidi-bouzid-regueb', 'sidi-bouzid', 'Regueb'),
  ('sidi-bouzid-meknassy', 'sidi-bouzid', 'Meknassy'),
  ('sidi-bouzid-menzel-bouzaiane', 'sidi-bouzid', 'Menzel Bouzaiane'),
  ('sidi-bouzid-jilma', 'sidi-bouzid', 'Jilma'),
  ('sidi-bouzid-bir-el-hafey', 'sidi-bouzid', 'Bir El Hafey'),
  ('sidi-bouzid-mezzouna', 'sidi-bouzid', 'Mezzouna'),
  ('gabes-gabes-ville', 'gabes', 'Gabès Ville'),
  ('gabes-mareth', 'gabes', 'Mareth'),
  ('gabes-el-hamma', 'gabes', 'El Hamma'),
  ('gabes-metouia', 'gabes', 'Métouia'),
  ('gabes-matmata', 'gabes', 'Matmata'),
  ('gabes-ghannouch', 'gabes', 'Ghannouch'),
  ('medenine-medenine-nord', 'medenine', 'Médenine Nord'),
  ('medenine-medenine-sud', 'medenine', 'Médenine Sud'),
  ('medenine-zarzis', 'medenine', 'Zarzis'),
  ('medenine-ben-gardane', 'medenine', 'Ben Gardane'),
  ('medenine-djerba-houmt-souk', 'medenine', 'Djerba Houmt Souk'),
  ('medenine-djerba-midoun', 'medenine', 'Djerba Midoun'),
  ('medenine-beni-khedache', 'medenine', 'Beni Khedache'),
  ('tataouine-tataouine-nord', 'tataouine', 'Tataouine Nord'),
  ('tataouine-tataouine-sud', 'tataouine', 'Tataouine Sud'),
  ('tataouine-ghomrassen', 'tataouine', 'Ghomrassen'),
  ('tataouine-bir-lahmar', 'tataouine', 'Bir Lahmar'),
  ('tataouine-remada', 'tataouine', 'Remada'),
  ('gafsa-gafsa-nord', 'gafsa', 'Gafsa Nord'),
  ('gafsa-gafsa-sud', 'gafsa', 'Gafsa Sud'),
  ('gafsa-el-ksar', 'gafsa', 'El Ksar'),
  ('gafsa-sned', 'gafsa', 'Sned'),
  ('gafsa-el-guettar', 'gafsa', 'El Guettar'),
  ('gafsa-metlaoui', 'gafsa', 'Métlaoui'),
  ('tozeur-tozeur', 'tozeur', 'Tozeur'),
  ('tozeur-nefta', 'tozeur', 'Nefta'),
  ('tozeur-degache', 'tozeur', 'Degache'),
  ('tozeur-tamerza', 'tozeur', 'Tamerza'),
  ('tozeur-hazoua', 'tozeur', 'Hazoua'),
  ('kebili-kebili-nord', 'kebili', 'Kébili Nord'),
  ('kebili-kebili-sud', 'kebili', 'Kébili Sud'),
  ('kebili-douz-nord', 'kebili', 'Douz Nord'),
  ('kebili-douz-sud', 'kebili', 'Douz Sud'),
  ('kebili-souk-lahad', 'kebili', 'Souk Lahad'),
  ('kebili-faouar', 'kebili', 'Faouar')
on conflict (id) do nothing;

-- Comptes de démonstration (environnement local uniquement)
insert into auth.users (id, email) values ('00000000-0000-4000-9000-000000000001', 'porteur.demo@verdolive.test'), ('00000000-0000-4000-9000-000000000002', 'admin.demo@verdolive.test') on conflict do nothing;
insert into profiles (id, full_name, roles, email_verified_at) values ('00000000-0000-4000-9000-000000000001', 'Porteur Démo', '{owner}', now()), ('00000000-0000-4000-9000-000000000002', 'Admin Démo', '{admin}', now())
  on conflict (id) do update set full_name = excluded.full_name, roles = excluded.roles, email_verified_at = excluded.email_verified_at;

-- Oliveraie – Cap Bon : priority (Titre vérifié, eau analysée, 3 documents)
insert into lands (id, ref, owner_id, status, wizard_step, objective, title, governorate_id, delegation_id, lat, lng, area_ha, crops, ranking_status, ranking_reason, title_proof, water_proof, has_flow, score_legal, score_water, score_completeness, submitted_at, published_at) values ('00000000-0000-4000-8000-000000000001', 'VO-DEMO1', '00000000-0000-4000-9000-000000000001', 'published', 7, 'sale', 'Oliveraie – Cap Bon', 'nabeul', 'nabeul-korba', 36.58, 10.86, 50, 'Oliviers Chetoui, 40 ans', 'priority', 'Titre vérifié, eau analysée, 3 documents', 'verified', 'analyzed', true, 90, 85, 100, '2026-11-02', '2026-11-02');
insert into land_titles (land_id, answer, number, ownership, joint_owners_agree, alt_document, registration_in_progress, verified_by, verified_at) values ('00000000-0000-4000-8000-000000000001', 'yes', '45127/12', 'individual', null, null, null, '00000000-0000-4000-9000-000000000002', '2026-11-02');
insert into land_water (land_id, answer, sources, availability, flow_value, flow_unit, flow_nature, shared, shared_details, nearby_source, nearby_distance_km, rainfed) values ('00000000-0000-4000-8000-000000000001', 'yes', array['well']::text[], 'year_round', 4, 'l_s', 'measured', null, null, null, null, null);
insert into land_offers (land_id, price_tnd, rent_tnd, rent_period, partnership_type, owner_share_pct) values ('00000000-0000-4000-8000-000000000001', 850000, null, null, null, null);

-- Oliveraie – Sfax : priority (Titre déclaré avec document, eau déclarée, 2 documents)
insert into lands (id, ref, owner_id, status, wizard_step, objective, title, governorate_id, delegation_id, lat, lng, area_ha, crops, ranking_status, ranking_reason, title_proof, water_proof, has_flow, score_legal, score_water, score_completeness, submitted_at, published_at) values ('00000000-0000-4000-8000-000000000002', 'VO-DEMO2', '00000000-0000-4000-9000-000000000001', 'published', 7, 'sale', 'Oliveraie – Sfax', 'sfax', 'sfax-agareb', 34.74, 10.47, 75, 'Oliviers Chemlali', 'priority', 'Titre déclaré avec document, eau déclarée, 2 documents', 'document', 'declared', true, 70, 70, 100, '2026-11-10', '2026-11-10');
insert into land_titles (land_id, answer, number, ownership, joint_owners_agree, alt_document, registration_in_progress, verified_by, verified_at) values ('00000000-0000-4000-8000-000000000002', 'yes', '88412/Sfax', 'individual', null, null, null, null, null);
insert into land_water (land_id, answer, sources, availability, flow_value, flow_unit, flow_nature, shared, shared_details, nearby_source, nearby_distance_km, rainfed) values ('00000000-0000-4000-8000-000000000002', 'yes', array['borehole']::text[], 'year_round', 6, 'l_s', 'declared', null, null, null, null, null);
insert into land_offers (land_id, price_tnd, rent_tnd, rent_period, partnership_type, owner_share_pct) values ('00000000-0000-4000-8000-000000000002', 1200000, null, null, null, null);

-- Terrain agricole – Mahdia : priority (Titre déclaré, eau déclarée, aucun document)
insert into lands (id, ref, owner_id, status, wizard_step, objective, title, governorate_id, delegation_id, lat, lng, area_ha, crops, ranking_status, ranking_reason, title_proof, water_proof, has_flow, score_legal, score_water, score_completeness, submitted_at, published_at) values ('00000000-0000-4000-8000-000000000003', 'VO-DEMO3', '00000000-0000-4000-9000-000000000001', 'published', 7, 'partnership', 'Terrain agricole – Mahdia', 'mahdia', 'mahdia-ksour-essef', 35.42, 10.99, 120, 'Terre nue, ancien céréalier', 'priority', 'Titre déclaré, eau déclarée, aucun document', 'declared', 'declared', false, 55, 47, 89, '2026-11-18', '2026-11-18');
insert into land_titles (land_id, answer, number, ownership, joint_owners_agree, alt_document, registration_in_progress, verified_by, verified_at) values ('00000000-0000-4000-8000-000000000003', 'yes', '10233', 'joint', true, null, null, null, null);
insert into land_water (land_id, answer, sources, availability, flow_value, flow_unit, flow_nature, shared, shared_details, nearby_source, nearby_distance_km, rainfed) values ('00000000-0000-4000-8000-000000000003', 'yes', array['well', 'cistern']::text[], 'seasonal', null, null, null, 'yes', 'Puits partagé avec la parcelle voisine, tour d''eau le mardi.', null, null, null);
insert into land_offers (land_id, price_tnd, rent_tnd, rent_period, partnership_type, owner_share_pct) values ('00000000-0000-4000-8000-000000000003', null, null, null, 'mgharsa', 40);

-- Verger d'amandiers – Sidi Bouzid : needs_check (Titre déclaré, sans eau sur le terrain, 1 document)
insert into lands (id, ref, owner_id, status, wizard_step, objective, title, governorate_id, delegation_id, lat, lng, area_ha, crops, ranking_status, ranking_reason, title_proof, water_proof, has_flow, score_legal, score_water, score_completeness, submitted_at, published_at) values ('00000000-0000-4000-8000-000000000004', 'VO-DEMO4', '00000000-0000-4000-9000-000000000001', 'published', 7, 'rent', 'Verger d''amandiers – Sidi Bouzid', 'sidi-bouzid', 'sidi-bouzid-regueb', 34.86, 9.79, 30, 'Amandiers, 12 ans', 'needs_check', 'Titre déclaré, sans eau sur le terrain, 1 document', 'declared', 'none', false, 55, 10, 95, '2026-11-15', '2026-11-15');
insert into land_titles (land_id, answer, number, ownership, joint_owners_agree, alt_document, registration_in_progress, verified_by, verified_at) values ('00000000-0000-4000-8000-000000000004', 'yes', '7781/SB', 'individual', null, null, null, null, null);
insert into land_water (land_id, answer, sources, availability, flow_value, flow_unit, flow_nature, shared, shared_details, nearby_source, nearby_distance_km, rainfed) values ('00000000-0000-4000-8000-000000000004', 'no', array[]::text[], null, null, null, null, null, null, 'yes', 1.5, null);
insert into land_offers (land_id, price_tnd, rent_tnd, rent_period, partnership_type, owner_share_pct) values ('00000000-0000-4000-8000-000000000004', null, 18000, 'annuel', null, null);

-- Palmeraie – Tozeur : needs_check (Titre non confirmé, eau déclarée, aucun document)
insert into lands (id, ref, owner_id, status, wizard_step, objective, title, governorate_id, delegation_id, lat, lng, area_ha, crops, ranking_status, ranking_reason, title_proof, water_proof, has_flow, score_legal, score_water, score_completeness, submitted_at, published_at) values ('00000000-0000-4000-8000-000000000005', 'VO-DEMO5', '00000000-0000-4000-9000-000000000001', 'published', 7, 'partnership', 'Palmeraie – Tozeur', 'tozeur', 'tozeur-nefta', 33.87, 7.88, 8, 'Palmiers Deglet Nour', 'needs_check', 'Titre non confirmé, eau déclarée, aucun document', 'none', 'declared', false, 0, 55, 91, '2026-11-20', '2026-11-20');
insert into land_titles (land_id, answer, number, ownership, joint_owners_agree, alt_document, registration_in_progress, verified_by, verified_at) values ('00000000-0000-4000-8000-000000000005', 'unknown', null, null, null, null, null, null, null);
insert into land_water (land_id, answer, sources, availability, flow_value, flow_unit, flow_nature, shared, shared_details, nearby_source, nearby_distance_km, rainfed) values ('00000000-0000-4000-8000-000000000005', 'yes', array['network']::text[], 'year_round', null, null, null, null, null, null, null, null);
insert into land_offers (land_id, price_tnd, rent_tnd, rent_period, partnership_type, owner_share_pct) values ('00000000-0000-4000-8000-000000000005', null, null, null, 'mgharsa', 50);

-- Oliveraie – Zaghouan : priority (Titre déclaré, eau déclarée, 1 document)
insert into lands (id, ref, owner_id, status, wizard_step, objective, title, governorate_id, delegation_id, lat, lng, area_ha, crops, ranking_status, ranking_reason, title_proof, water_proof, has_flow, score_legal, score_water, score_completeness, submitted_at, published_at) values ('00000000-0000-4000-8000-000000000006', 'VO-DEMO6', '00000000-0000-4000-9000-000000000001', 'published', 7, 'sale', 'Oliveraie – Zaghouan', 'zaghouan', 'zaghouan-el-fahs', 36.37, 9.9, 60, 'Oliviers, 25 ans', 'priority', 'Titre déclaré, eau déclarée, 1 document', 'declared', 'declared', false, 55, 55, 91, '2026-11-21', '2026-11-21');
insert into land_titles (land_id, answer, number, ownership, joint_owners_agree, alt_document, registration_in_progress, verified_by, verified_at) values ('00000000-0000-4000-8000-000000000006', 'yes', '3321/Z', 'individual', null, null, null, null, null);
insert into land_water (land_id, answer, sources, availability, flow_value, flow_unit, flow_nature, shared, shared_details, nearby_source, nearby_distance_km, rainfed) values ('00000000-0000-4000-8000-000000000006', 'yes', array['borehole']::text[], 'year_round', null, null, null, null, null, null, null, null);
insert into land_offers (land_id, price_tnd, rent_tnd, rent_period, partnership_type, owner_share_pct) values ('00000000-0000-4000-8000-000000000006', 990000, null, null, null, null);

-- Terre de culture – Kairouan : low (Sans titre foncier, sans eau sur le terrain, 1 document)
insert into lands (id, ref, owner_id, status, wizard_step, objective, title, governorate_id, delegation_id, lat, lng, area_ha, crops, ranking_status, ranking_reason, title_proof, water_proof, has_flow, score_legal, score_water, score_completeness, submitted_at, published_at) values ('00000000-0000-4000-8000-000000000007', 'VO-DEMO7', '00000000-0000-4000-9000-000000000001', 'published', 7, 'rent', 'Terre de culture – Kairouan', 'kairouan', 'kairouan-haffouz', 35.63, 9.67, 40, 'Céréales', 'low', 'Sans titre foncier, sans eau sur le terrain, 1 document', 'none', 'none', false, 25, 0, 93, '2026-11-12', '2026-11-12');
insert into land_titles (land_id, answer, number, ownership, joint_owners_agree, alt_document, registration_in_progress, verified_by, verified_at) values ('00000000-0000-4000-8000-000000000007', 'no', null, null, null, 'adoulaire', 'yes', null, null);
insert into land_water (land_id, answer, sources, availability, flow_value, flow_unit, flow_nature, shared, shared_details, nearby_source, nearby_distance_km, rainfed) values ('00000000-0000-4000-8000-000000000007', 'no', array[]::text[], null, null, null, null, null, null, 'no', null, true);
insert into land_offers (land_id, price_tnd, rent_tnd, rent_period, partnership_type, owner_share_pct) values ('00000000-0000-4000-8000-000000000007', null, 12000, 'annuel', null, null);
