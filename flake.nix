{
  description = "cue-plugins: opencode plugins for the cue ecosystem";

  inputs = {
    nixpkgs.url = "github:NixOS/nixpkgs/nixos-unstable";
    flake-utils.url = "github:numtide/flake-utils";
    cue = {
      url = "github:palekiwi-labs/cue";
      inputs.nixpkgs.follows = "nixpkgs";
      inputs.flake-utils.follows = "flake-utils";
    };
  };

  outputs = { nixpkgs, flake-utils, cue, ... }:
    flake-utils.lib.eachDefaultSystem (system:
      let
        pkgs = nixpkgs.legacyPackages.${system};
      in
      {
        devShells.default = pkgs.mkShell {
          name = "cue-plugins";
          buildInputs = [
            pkgs.bun
            pkgs.typescript
          ];

          shellHook = ''
            echo "bun $(bun --version)"
          '';
        };

        # Regenerate src/generated/acuity/ from the acuity-schema crate
        # pinned via the cue flake input. Run from the repo root:
        #   nix run .#update-types
        # The codegen binary writes directly into the source tree — no copy
        # from the nix store, so no permission issues with read-only files.
        # The `generated/` prefix signals these files are machine-produced;
        # mark them in .gitattributes with linguist-generated=true.
        packages.update-types = pkgs.writeShellScriptBin "update-types" ''
          set -euo pipefail
          rm -rf src/generated/acuity
          ${cue.packages.${system}.acuity-schema-codegen}/bin/codegen src/generated/acuity
          echo "generated types in src/generated/acuity/"
        '';
      });
}
