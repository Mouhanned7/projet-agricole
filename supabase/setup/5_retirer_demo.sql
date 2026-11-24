-- À exécuter AVANT l'ouverture au public : retire les 7 terrains et les 2 comptes fictifs.
delete from lands where id::text like '00000000-0000-4000-8000-%';
delete from auth.users where id in ('00000000-0000-4000-9000-000000000001', '00000000-0000-4000-9000-000000000002');
select count(*) as terrains_restants from lands;
