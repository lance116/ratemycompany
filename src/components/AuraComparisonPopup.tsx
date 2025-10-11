import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { X } from "lucide-react";

interface AuraComparisonPopupProps {
  isOpen: boolean;
  onClose: () => void;
}

const AuraComparisonPopup = ({ isOpen, onClose }: AuraComparisonPopupProps) => {
  const [isVideoLoading, setIsVideoLoading] = useState(true);

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[600px] w-[90vw] p-0 overflow-hidden">
        <DialogHeader className="p-6 pb-4">
          <div className="flex items-center justify-between">
            <DialogTitle className="text-xl font-bold text-center flex-1">
              Which SWE internship has more aura?
            </DialogTitle>
            <Button
              variant="ghost"
              size="sm"
              onClick={onClose}
              className="h-8 w-8 p-0 hover:bg-gray-100"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </DialogHeader>
        
        <div className="px-6 pb-6">
          {/* Video Placeholder */}
          <div className="relative w-full bg-gray-100 rounded-lg overflow-hidden mb-4">
            <div className="aspect-video w-full bg-gradient-to-br from-gray-200 to-gray-300 flex items-center justify-center">
              {isVideoLoading && (
                <div className="text-center">
                  <div className="w-16 h-16 mx-auto mb-4 bg-gray-400 rounded-full flex items-center justify-center">
                    <svg
                      className="w-8 h-8 text-white"
                      fill="currentColor"
                      viewBox="0 0 20 20"
                    >
                      <path
                        fillRule="evenodd"
                        d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z"
                        clipRule="evenodd"
                      />
                    </svg>
                  </div>
                  <p className="text-gray-600 text-sm font-medium">Video Coming Soon</p>
                  <p className="text-gray-500 text-xs mt-1">Placeholder for aura comparison video</p>
                </div>
              )}
            </div>
          </div>
          
          {/* Action Button */}
          <Button 
            className="w-full"
            onClick={onClose}
          >
            Let's start!
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default AuraComparisonPopup;
