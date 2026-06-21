{
  description = "cue-plugins: opencode plugins for the cue ecosystem";

  inputs = {
    nixpkgs.url = "github:NixOS/nixpkgs/nixos-unstable";
    flake-utils.url = "github:numtide/flake-utils";
  };

  outputs = { nixpkgs, flake-utils, ... }:
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
      });
}
