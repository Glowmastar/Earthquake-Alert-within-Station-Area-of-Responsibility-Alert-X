import React from 'react';
import { X, AlertCircle, Send, CheckCircle2, Clock, MapPin, Layers, Radio } from 'lucide-react';
import { EarthquakeRecord } from '../types';

interface EarthquakeModalProps {
  earthquake: EarthquakeRecord | null;
  onClose: () => void;
  onApproveReview?: (id: string) => void;
  onResendAlert?: (record: EarthquakeRecord) => void;
}

export const EarthquakeModal: React.FC<EarthquakeModalProps> = ({
  earthquake,
  onClose,
  onApproveReview,
  onResendAlert,
}) => {
  if (!earthquake) return null;

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        {/* Modal Header */}
        <div className="bg-[#0b172a] text-white px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-blue-500/20 border border-blue-400/30 flex items-center justify-center text-blue-400">
              <Radio className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-bold text-base tracking-tight text-white">
                  Seismic Event Details
                </h3>
                <span className="text-[10px] font-mono bg-blue-500/20 text-blue-300 border border-blue-400/30 px-2 py-0.5 rounded-sm">
                  {earthquake.id}
                </span>
              </div>
              <p className="text-xs text-slate-400">PHIVOLCS EQInfo Verified Bulletin</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1 rounded-md text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 space-y-5 max-h-[80vh] overflow-y-auto">
          {/* Quick Stat Highlights */}
          <div className="grid grid-cols-4 gap-3 bg-slate-50 p-4 rounded-xl border border-slate-100">
            <div>
              <span className="text-[11px] text-slate-500 font-medium block">Magnitude</span>
              <span className="text-2xl font-black text-rose-600 font-mono">
                M{earthquake.magnitude.toFixed(1)}
              </span>
            </div>
            <div>
              <span className="text-[11px] text-slate-500 font-medium block">Focal Depth</span>
              <span className="text-2xl font-bold text-slate-800 font-mono">
                {earthquake.depthKm} <span className="text-xs font-normal text-slate-500">km</span>
              </span>
            </div>
            <div>
              <span className="text-[11px] text-slate-500 font-medium block">AOR Sector</span>
              <span className="text-lg font-bold text-blue-600 block mt-0.5">
                {earthquake.aor}
              </span>
            </div>
            <div>
              <span className="text-[11px] text-slate-500 font-medium block">Alert Status</span>
              <span
                className={`inline-block text-xs font-semibold px-2.5 py-1 rounded-full mt-1 ${
                  earthquake.status === 'Alert Sent'
                    ? 'bg-emerald-100 text-emerald-800'
                    : earthquake.status === 'For Review'
                    ? 'bg-amber-100 text-amber-800'
                    : 'bg-slate-200 text-slate-700'
                }`}
              >
                {earthquake.status}
              </span>
            </div>
          </div>

          {/* Location & Time Grid */}
          <div className="grid grid-cols-2 gap-4 text-xs">
            <div className="space-y-1.5">
              <div className="text-slate-500 font-medium flex items-center gap-1.5">
                <MapPin className="w-3.5 h-3.5 text-blue-600" />
                <span>Epicenter Location</span>
              </div>
              <div className="font-semibold text-slate-900 text-sm">{earthquake.location}</div>
              <div className="text-slate-500 font-mono">
                Lat: {earthquake.coordinates.lat}°N, Lng: {earthquake.coordinates.lng}°E
              </div>
            </div>

            <div className="space-y-1.5">
              <div className="text-slate-500 font-medium flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5 text-blue-600" />
                <span>Origin Time (PHT)</span>
              </div>
              <div className="font-semibold text-slate-900 text-sm">{earthquake.timePHT}</div>
              <div className="text-slate-500">Philippine Standard Time (UTC+8)</div>
            </div>
          </div>

          {/* Geological & Intensity Context */}
          <div className="border-t border-slate-100 pt-4 space-y-2 text-xs">
            <div className="flex items-center gap-2 text-slate-700 font-semibold">
              <Layers className="w-4 h-4 text-blue-600" />
              <span>Tectonic & Seismological Context</span>
            </div>
            <div className="bg-blue-50/50 p-3 rounded-lg border border-blue-100/60 space-y-1.5">
              <div className="flex justify-between">
                <span className="text-slate-600">Assigned Fault System:</span>
                <span className="font-medium text-slate-800">
                  {earthquake.faultSystem || 'Philippine Fault Zone / Regional Structure'}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-600">Reported Intensity:</span>
                <span className="font-semibold text-slate-800">
                  {earthquake.intensity || 'PEIS II - IV (Under Evaluation)'}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-600">Primary Ingest Source:</span>
                <span className="text-slate-700">{earthquake.source}</span>
              </div>
            </div>
          </div>

          {/* Email Alert & Notification Section */}
          <div className="border-t border-slate-100 pt-4 space-y-3">
            <h4 className="text-xs font-bold text-slate-800 tracking-tight flex items-center gap-2">
              <Send className="w-4 h-4 text-blue-600" />
              <span>Automated Dispatch Log</span>
            </h4>

            {earthquake.alertDetails ? (
              <div className="bg-slate-50 rounded-xl p-3.5 border border-slate-200/80 text-xs space-y-2">
                {earthquake.alertDetails.sentAt && (
                  <div className="flex items-center justify-between">
                    <span className="text-slate-500">Dispatch Timestamp:</span>
                    <span className="font-semibold text-slate-800 font-mono">
                      {earthquake.alertDetails.sentAt}
                    </span>
                  </div>
                )}
                {earthquake.alertDetails.recipientsCount !== undefined && (
                  <div className="flex items-center justify-between">
                    <span className="text-slate-500">Recipients Notified:</span>
                    <span className="font-semibold text-slate-800">
                      {earthquake.alertDetails.recipientsCount} emergency contacts
                    </span>
                  </div>
                )}
                {earthquake.alertDetails.deliveryRate && (
                  <div className="flex items-center justify-between">
                    <span className="text-slate-500">Relay Delivery Rate:</span>
                    <span className="font-bold text-emerald-600">
                      {earthquake.alertDetails.deliveryRate}
                    </span>
                  </div>
                )}
                {earthquake.alertDetails.notes && (
                  <div className="pt-2 border-t border-slate-200/60 text-slate-600 italic">
                    Note: {earthquake.alertDetails.notes}
                  </div>
                )}
              </div>
            ) : (
              <p className="text-xs text-slate-500 italic">
                No automatic dispatch triggered for this event (Event is outside designated AOR boundaries).
              </p>
            )}
          </div>
        </div>

        {/* Modal Footer Actions */}
        <div className="bg-slate-50 px-6 py-4 border-t border-slate-200 flex items-center justify-between">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-800 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors"
          >
            Close
          </button>

          <div className="flex items-center gap-2">
            {earthquake.status === 'For Review' && onApproveReview && (
              <button
                type="button"
                onClick={() => {
                  onApproveReview(earthquake.id);
                  onClose();
                }}
                className="px-4 py-2 text-xs font-semibold text-white bg-amber-600 hover:bg-amber-700 rounded-lg transition-colors flex items-center gap-1.5 shadow-sm"
              >
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>Approve & Send Alert</span>
              </button>
            )}

            {earthquake.status === 'Alert Sent' && onResendAlert && (
              <button
                type="button"
                onClick={() => {
                  onResendAlert(earthquake);
                  onClose();
                }}
                className="px-4 py-2 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors flex items-center gap-1.5 shadow-sm"
              >
                <Send className="w-3.5 h-3.5" />
                <span>Resend Email Dispatch</span>
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
