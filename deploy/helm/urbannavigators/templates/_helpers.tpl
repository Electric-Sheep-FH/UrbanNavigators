{{/* Configuration effective d'un service : valeurs "defaults" surchargées par celles du service. */}}
{{- define "un.config" -}}
{{- $cfg := mergeOverwrite (deepCopy .ctx.Values.defaults) (deepCopy (default dict .svc)) -}}
{{- toYaml $cfg -}}
{{- end }}

{{- define "un.selectorLabels" -}}
app.kubernetes.io/name: {{ .name }}
app.kubernetes.io/instance: {{ .ctx.Release.Name }}
{{- end }}

{{- define "un.labels" -}}
{{ include "un.selectorLabels" . }}
app.kubernetes.io/part-of: urbannavigators
app.kubernetes.io/version: {{ .ctx.Values.image.tag | quote }}
app.kubernetes.io/managed-by: {{ .ctx.Release.Service }}
helm.sh/chart: {{ printf "%s-%s" .ctx.Chart.Name .ctx.Chart.Version }}
{{- end }}
