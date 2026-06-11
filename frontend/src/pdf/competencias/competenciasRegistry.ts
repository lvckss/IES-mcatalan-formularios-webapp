import anatomiaPatologicaUrl from "./anatomia-patologica-y-citodiagnostico.pdf?url";
import desarrolloAplicacionesMultiplataformaUrl from "./desarrollo-aplicaciones-multiplataforma.pdf?url";
import ensenanzaAnimacionSociodeportivaUrl from "./ensenanza-animacion-sociodeportiva.pdf?url";
import farmaciaParafarmaciaUrl from "./farmacia-parafarmacia.pdf?url";
import guiaMedioNaturalUrl from "./guia-medio-natural-tiempo-libre.pdf?url";
import imagenDiagnosticoUrl from "./imagen-diagnostico-medicina-nuclear.pdf?url";

const competenciasPdfPorCodigo: Readonly<Record<string, string>> = {
  // Los anexos entregados son LOE; los códigos LFP reutilizan el del mismo título.
  SAN301_LOE: anatomiaPatologicaUrl,
  SAN301_LFP: anatomiaPatologicaUrl,
  IFC302_LOE: desarrolloAplicacionesMultiplataformaUrl,
  IFC302_LFP: desarrolloAplicacionesMultiplataformaUrl,
  AFD301_LOE: ensenanzaAnimacionSociodeportivaUrl,
  AFD301_LFP: ensenanzaAnimacionSociodeportivaUrl,
  SAN202_LOE: farmaciaParafarmaciaUrl,
  SAN202_LFP: farmaciaParafarmaciaUrl,
  AFD201_LOE: guiaMedioNaturalUrl,
  AFD201_LFP: guiaMedioNaturalUrl,
  SAN305_LOE: imagenDiagnosticoUrl,
  SAN305_LFP: imagenDiagnosticoUrl,
};

export function getCompetenciasPdfUrl(codigoCiclo: string): string | undefined {
  return competenciasPdfPorCodigo[codigoCiclo];
}
