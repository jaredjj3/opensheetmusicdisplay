import Vex = require("vexflow");
import { Staff } from "../../VoiceData/Staff";
import { SourceMeasure } from "../../VoiceData/SourceMeasure";
import { VexFlowMeasure } from "./VexFlowMeasure";
import { VexFlowConverter } from "./VexFlowConverter";
import { StaffLine } from "../StaffLine";
import { GraphicalVoiceEntry } from "../GraphicalVoiceEntry";
import { VexFlowVoiceEntry } from "./VexFlowVoiceEntry";
import { Voice } from "../../VoiceData/Voice";


export class VexFlowTabMeasure extends VexFlowMeasure {
  constructor(staff: Staff, sourceMeasure: SourceMeasure = undefined, staffLine: StaffLine = undefined) {
    super(staff, sourceMeasure, staffLine);
  }

  /**
   * Reset all the geometric values and parameters of this measure and put it in an initialized state.
   * This is needed to evaluate a measure a second time by system builder.
   */
  public resetLayout(): void {
    // Take into account some space for the begin and end lines of the stave
    // Will be changed when repetitions will be implemented
    //this.beginInstructionsWidth = 20 / UnitInPixels;
    //this.endInstructionsWidth = 20 / UnitInPixels;
    this.stave = new Vex.Flow.TabStave(0, 0, 0, {
      space_above_staff_ln: 0,
      space_below_staff_ln: 0,
    });
    this.updateInstructionWidth();
  }
  public graphicalMeasureCreatedCalculations(): void {
    for (const graphicalStaffEntry of this.staffEntries) {
      // create vex flow Tab Notes:
      for (const gve of graphicalStaffEntry.graphicalVoiceEntries) {
        if (gve.notes[0].sourceNote.PrintObject) {
          (gve as VexFlowVoiceEntry).vfStaveNote = VexFlowConverter.TabNote(gve);
        } else {
          // don't render note. add ghost note, otherwise Vexflow can have issues with layouting when voices not complete.
          (gve as VexFlowVoiceEntry).vfStaveNote = VexFlowConverter.GhostNote(gve.notes[0].sourceNote.Length);
          continue;
        }
      }
    }

    this.finalizeTuplets();

    const voices: Voice[] = this.getVoicesWithinMeasure();

    for (const voice of voices) {
      if (voice === undefined) {
        continue;
      }

      const restFilledEntries: GraphicalVoiceEntry[] = this.getRestFilledVexFlowStaveNotesPerVoice(voice);
      for (const voiceEntry of restFilledEntries) {
        const vexFlowVoiceEntry: VexFlowVoiceEntry = voiceEntry as VexFlowVoiceEntry;
        // add a vexFlow voice for this voice:
        this.vfVoices[voice.VoiceId] = new Vex.Flow.Voice({
          beat_value: this.parentSourceMeasure.Duration.Denominator,
          num_beats: this.parentSourceMeasure.Duration.Numerator,
          resolution: Vex.Flow.RESOLUTION
        }).setMode(Vex.Flow.Voice.Mode.SOFT);

        this.vfVoices[voice.VoiceId].addTickable(vexFlowVoiceEntry.vfStaveNote);
      }
    }
  }
}
