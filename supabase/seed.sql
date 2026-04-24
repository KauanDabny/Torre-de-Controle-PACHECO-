
-- Seed data for TransPacheco Logistics Hub

-- Insert some vehicles
INSERT INTO public.vehicles (plate, prefix, last_lat, last_lng, last_speed, last_update, ignition, address)
VALUES 
('ABC-1234', '990-21', -16.6869, -49.2648, 80.0, now(), true, 'Goiânia, GO'),
('XYZ-8890', '992-18', -22.9068, -43.1729, 0.0, now(), false, 'Rio de Janeiro, RJ'),
('DFG-4451', '885-04', -15.7975, -47.8919, 65.0, now(), true, 'Brasília, DF');

-- Insert some initial shipments
INSERT INTO public.shipments (vehicle_name, plate, route, status, progress, client, last_update)
VALUES 
('Scania R450', 'ABC-1234', 'Goiânia → Manaus', 'EM TRÂNSITO', 45, 'J&T Express', now()),
('Mercedes Actros', 'XYZ-8890', 'Rio de Janeiro → Vitória', 'ENTREGA FINAL', 92, 'Mercado Livre', now()),
('Volvo FH 540', 'DFG-4451', 'Brasília → Fortaleza', 'PARADO (PONTO DE APOIO)', 60, 'Shopee', now());
